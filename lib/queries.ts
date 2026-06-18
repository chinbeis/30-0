import { sql } from "./db";
import type { SeasonResult } from "./game/types";

export interface Identity {
  playerKey: string; // stable: "google:<email>" or "guest:<uuid>"
  playerName: string;
  playerImage: string | null;
  playerSource: "google" | "guest";
}

export interface LeaderboardRow {
  rank: number;
  playerName: string;
  playerImage: string | null;
  playerSource: "google" | "guest";
  wins: number;
  losses: number;
  goatScore: number;
  tier: string;
}

export function shortId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

export async function insertRun(
  id: Identity,
  seed: string,
  mode: string,
  picks: string[],
  r: SeasonResult,
): Promise<void> {
  await sql`
    INSERT INTO runs (
      player_key, player_name, player_image, player_source,
      mode, seed, picks, wins, losses, goat_score, tier,
      mvp_fighter_id, weakest_fighter_id
    ) VALUES (
      ${id.playerKey}, ${id.playerName}, ${id.playerImage}, ${id.playerSource},
      ${mode}, ${seed}, ${JSON.stringify(picks)}::jsonb,
      ${r.wins}, ${r.losses}, ${r.goatScore}, ${r.tier.label},
      ${r.mvpFighterId}, ${r.weakestFighterId}
    )`;
}

/** Best-per-player, ranked by wins then GOAT score (82-0 style). */
export async function topLeaderboard(limit = 100): Promise<LeaderboardRow[]> {
  const rows = (await sql`
    SELECT * FROM (
      SELECT DISTINCT ON (player_key)
        player_key, player_name, player_image, player_source,
        wins, losses, goat_score, tier
      FROM runs
      ORDER BY player_key, wins DESC, goat_score DESC, created_at ASC
    ) best
    ORDER BY wins DESC, goat_score DESC
    LIMIT ${limit}
  `) as Record<string, unknown>[];
  return rows.map((row, i) => ({
    rank: i + 1,
    playerName: row.player_name as string,
    playerImage: (row.player_image as string) ?? null,
    playerSource: row.player_source as "google" | "guest",
    wins: row.wins as number,
    losses: row.losses as number,
    goatScore: row.goat_score as number,
    tier: row.tier as string,
  }));
}

/** Approximate global rank for a (wins, goat) result among players' bests. */
export async function rankForResult(wins: number, goat: number): Promise<number> {
  const rows = (await sql`
    WITH best AS (
      SELECT DISTINCT ON (player_key) player_key, wins, goat_score
      FROM runs
      ORDER BY player_key, wins DESC, goat_score DESC, created_at ASC
    )
    SELECT count(*)::int AS better FROM best
    WHERE wins > ${wins} OR (wins = ${wins} AND goat_score > ${goat})
  `) as { better: number }[];
  return (rows[0]?.better ?? 0) + 1;
}

export interface ChallengeRow {
  id: string;
  seed: string;
  creatorName: string;
  creatorPicks: string[];
  creatorWins: number;
  creatorLosses: number;
  creatorGoat: number;
}

export async function createChallenge(
  seed: string,
  name: string,
  picks: string[],
  r: SeasonResult,
): Promise<string> {
  const id = shortId();
  await sql`
    INSERT INTO challenges (
      id, seed, creator_name, creator_picks,
      creator_wins, creator_losses, creator_goat
    ) VALUES (
      ${id}, ${seed}, ${name}, ${JSON.stringify(picks)}::jsonb,
      ${r.wins}, ${r.losses}, ${r.goatScore}
    )`;
  return id;
}

// ---- GOAT fighter portraits (cache of generated images) ----

export async function getPortrait(buildKey: string): Promise<string | null> {
  const rows = (await sql`
    SELECT image FROM goat_portraits WHERE build_key = ${buildKey} LIMIT 1
  `) as { image: string }[];
  return rows[0]?.image ?? null;
}

export async function savePortrait(buildKey: string, image: string): Promise<void> {
  await sql`
    INSERT INTO goat_portraits (build_key, image) VALUES (${buildKey}, ${image})
    ON CONFLICT (build_key) DO NOTHING
  `;
}

export async function getChallenge(id: string): Promise<ChallengeRow | null> {
  const rows = (await sql`
    SELECT id, seed, creator_name, creator_picks,
           creator_wins, creator_losses, creator_goat
    FROM challenges WHERE id = ${id} LIMIT 1
  `) as Record<string, unknown>[];
  if (!rows.length) return null;
  const row = rows[0];
  return {
    id: row.id as string,
    seed: row.seed as string,
    creatorName: row.creator_name as string,
    creatorPicks: row.creator_picks as string[],
    creatorWins: row.creator_wins as number,
    creatorLosses: row.creator_losses as number,
    creatorGoat: row.creator_goat as number,
  };
}
