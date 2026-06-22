import { sql } from "./db";
import type { SeasonResult } from "./game/types";
import type { CareerResult } from "./goat/types";

/** Which game a run/challenge/leaderboard belongs to. */
export type Game = "30-0" | "goat";

export type PlayerSource = "google" | "guest" | "email";

export interface Identity {
  playerKey: string; // stable: "google:<email>", "email:<email>" or "guest:<uuid>"
  playerName: string;
  playerImage: string | null;
  playerSource: PlayerSource;
}

export interface LeaderboardRow {
  rank: number;
  playerName: string;
  playerImage: string | null;
  playerSource: PlayerSource;
  wins: number;
  losses: number;
  goatScore: number;
  tier: string;
}

// ---- Email/password accounts (Auth.js Credentials provider) ----

export interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const rows = (await sql`
    SELECT id, email, password_hash, name FROM users WHERE email = ${email} LIMIT 1
  `) as Record<string, unknown>[];
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id as string,
    email: r.email as string,
    passwordHash: r.password_hash as string,
    name: (r.name as string) ?? null,
  };
}

/** Create an account. Returns null if the email is already taken. */
export async function createUser(
  email: string,
  passwordHash: string,
  name: string | null,
): Promise<UserRow | null> {
  const rows = (await sql`
    INSERT INTO users (email, password_hash, name)
    VALUES (${email}, ${passwordHash}, ${name})
    ON CONFLICT (email) DO NOTHING
    RETURNING id, email, password_hash, name
  `) as Record<string, unknown>[];
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id as string,
    email: r.email as string,
    passwordHash: r.password_hash as string,
    name: (r.name as string) ?? null,
  };
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

export type LeaderboardRange = "all" | "weekly" | "daily";

const RANGE_DAYS: Record<Exclude<LeaderboardRange, "all">, number> = {
  daily: 1,
  weekly: 7,
};

/** Best-per-player, ranked by wins then GOAT score (82-0 style). */
export async function topLeaderboard(
  limit = 100,
  range: LeaderboardRange = "all",
  game: Game = "30-0",
): Promise<LeaderboardRow[]> {
  // `game` is always a bound value; only the optional time window changes the
  // shape of the WHERE clause, so we branch on range alone (Neon's HTTP sql
  // can't splice nested fragments).
  const rows = (
    range === "all"
      ? await sql`
          SELECT * FROM (
            SELECT DISTINCT ON (player_key)
              player_key, player_name, player_image, player_source,
              wins, losses, goat_score, tier
            FROM runs
            WHERE game = ${game}
            ORDER BY player_key, wins DESC, goat_score DESC, created_at ASC
          ) best
          ORDER BY wins DESC, goat_score DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT * FROM (
            SELECT DISTINCT ON (player_key)
              player_key, player_name, player_image, player_source,
              wins, losses, goat_score, tier
            FROM runs
            WHERE game = ${game}
              AND created_at >= now() - (${RANGE_DAYS[range]} || ' days')::interval
            ORDER BY player_key, wins DESC, goat_score DESC, created_at ASC
          ) best
          ORDER BY wins DESC, goat_score DESC
          LIMIT ${limit}
        `
  ) as Record<string, unknown>[];
  return rows.map((row, i) => ({
    rank: i + 1,
    playerName: row.player_name as string,
    playerImage: (row.player_image as string) ?? null,
    playerSource: row.player_source as PlayerSource,
    wins: row.wins as number,
    losses: row.losses as number,
    goatScore: row.goat_score as number,
    tier: row.tier as string,
  }));
}

/** Approximate global rank for a (wins, goat) result among players' bests. */
export async function rankForResult(
  wins: number,
  goat: number,
  game: Game = "30-0",
): Promise<number> {
  const rows = (await sql`
    WITH best AS (
      SELECT DISTINCT ON (player_key) player_key, wins, goat_score
      FROM runs
      WHERE game = ${game}
      ORDER BY player_key, wins DESC, goat_score DESC, created_at ASC
    )
    SELECT count(*)::int AS better FROM best
    WHERE wins > ${wins} OR (wins = ${wins} AND goat_score > ${goat})
  `) as { better: number }[];
  return (rows[0]?.better ?? 0) + 1;
}

/** GOAT career → runs row (game='goat'). MVP/weakest map to the source fighter ids. */
export async function insertGoatRun(
  id: Identity,
  picks: string[],
  r: CareerResult,
): Promise<void> {
  const mvpId = r.attributes.sources[r.biggestStrength.attribute];
  const weakId = r.attributes.sources[r.biggestWeakness.attribute];
  await sql`
    INSERT INTO runs (
      player_key, player_name, player_image, player_source,
      game, mode, seed, picks, wins, losses, goat_score, tier,
      mvp_fighter_id, weakest_fighter_id
    ) VALUES (
      ${id.playerKey}, ${id.playerName}, ${id.playerImage}, ${id.playerSource},
      'goat', 'goat', ${r.simSeed}, ${JSON.stringify(picks)}::jsonb,
      ${r.wins}, ${r.losses}, ${r.goatScore}, ${r.tier.label},
      ${mvpId}, ${weakId}
    )`;
}

// ---- Profile (per-player stats + recent games) ----

export interface ProfileStats {
  gamesPlayed: number;
  bestScore: number | null;
  bestWins: number | null;
  bestLosses: number | null;
}

export async function playerStats(playerKey: string): Promise<ProfileStats> {
  const agg = (await sql`
    SELECT count(*)::int AS games, max(goat_score)::int AS best_score
    FROM runs WHERE player_key = ${playerKey}
  `) as { games: number; best_score: number | null }[];
  const best = (await sql`
    SELECT wins, losses FROM runs WHERE player_key = ${playerKey}
    ORDER BY wins DESC, losses ASC, goat_score DESC LIMIT 1
  `) as { wins: number; losses: number }[];
  return {
    gamesPlayed: agg[0]?.games ?? 0,
    bestScore: agg[0]?.best_score ?? null,
    bestWins: best[0]?.wins ?? null,
    bestLosses: best[0]?.losses ?? null,
  };
}

export interface RecentRun {
  game: Game;
  wins: number;
  losses: number;
  goatScore: number;
  tier: string;
  createdAt: string;
}

export async function recentRuns(playerKey: string, limit = 10): Promise<RecentRun[]> {
  const rows = (await sql`
    SELECT game, wins, losses, goat_score, tier, created_at
    FROM runs WHERE player_key = ${playerKey}
    ORDER BY created_at DESC LIMIT ${limit}
  `) as Record<string, unknown>[];
  return rows.map((r) => ({
    game: (r.game as Game) ?? "30-0",
    wins: r.wins as number,
    losses: r.losses as number,
    goatScore: r.goat_score as number,
    tier: r.tier as string,
    createdAt: new Date(r.created_at as string).toISOString(),
  }));
}

export interface ChallengeRow {
  id: string;
  game: Game;
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
      id, game, seed, creator_name, creator_picks,
      creator_wins, creator_losses, creator_goat
    ) VALUES (
      ${id}, '30-0', ${seed}, ${name}, ${JSON.stringify(picks)}::jsonb,
      ${r.wins}, ${r.losses}, ${r.goatScore}
    )`;
  return id;
}

/** GOAT challenge: same table, game='goat', creator_* from the career result. */
export async function createGoatChallenge(
  seed: string,
  name: string,
  picks: string[],
  r: CareerResult,
): Promise<string> {
  const id = shortId();
  await sql`
    INSERT INTO challenges (
      id, game, seed, creator_name, creator_picks,
      creator_wins, creator_losses, creator_goat
    ) VALUES (
      ${id}, 'goat', ${seed}, ${name}, ${JSON.stringify(picks)}::jsonb,
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
    SELECT id, game, seed, creator_name, creator_picks,
           creator_wins, creator_losses, creator_goat
    FROM challenges WHERE id = ${id} LIMIT 1
  `) as Record<string, unknown>[];
  if (!rows.length) return null;
  const row = rows[0];
  return {
    id: row.id as string,
    game: (row.game as Game) ?? "30-0",
    seed: row.seed as string,
    creatorName: row.creator_name as string,
    creatorPicks: row.creator_picks as string[],
    creatorWins: row.creator_wins as number,
    creatorLosses: row.creator_losses as number,
    creatorGoat: row.creator_goat as number,
  };
}
