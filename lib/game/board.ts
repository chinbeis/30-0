import type { Fighter } from "./types";
import { FIGHTERS } from "./fighters";
import { rngFromSeed, shuffle } from "./rng";
import { ROSTER_SIZE } from "./engine";

export const CHOICES_PER_ROUND = 3;
/** Shared reroll budget across the whole 10-round draft (not per round). */
export const REROLLS_TOTAL = 3;

export interface Round {
  round: number; // 1..10
  options: Fighter[]; // 3 fighters (the base page)
}

export interface Board {
  seed: string;
  rounds: Round[];
  /** REROLLS_TOTAL alternate sets of 3, all distinct from the base 30 and each
   *  other. Each reroll the player spends reveals the next unused set. */
  rerollSets: Fighter[][];
}

/**
 * Build the 10-round board for a seed. Each round offers 3 distinct fighters and
 * no fighter appears twice across the base board, so every run assembles a roster
 * of 10 unique fighters. We also reserve REROLLS_TOTAL × 3 extra distinct fighters
 * as reroll sets. Deterministic: same seed => same board (this is what makes the
 * Daily Challenge identical for everyone and lets share/challenge links replay).
 */
export function buildBoard(seed: string): Board {
  const rng = rngFromSeed(seed);
  const pool = shuffle(rng, FIGHTERS);
  const base = ROSTER_SIZE * CHOICES_PER_ROUND; // 30
  const reserve = REROLLS_TOTAL * CHOICES_PER_ROUND; // 9
  const needed = base + reserve; // 39 distinct fighters
  if (pool.length < needed) {
    throw new Error(`Pool too small: need ${needed} fighters, have ${pool.length}`);
  }
  const rounds: Round[] = [];
  for (let r = 0; r < ROSTER_SIZE; r++) {
    rounds.push({
      round: r + 1,
      options: pool.slice(r * CHOICES_PER_ROUND, (r + 1) * CHOICES_PER_ROUND),
    });
  }
  const rerollSets: Fighter[][] = [];
  for (let i = 0; i < REROLLS_TOTAL; i++) {
    const start = base + i * CHOICES_PER_ROUND;
    rerollSets.push(pool.slice(start, start + CHOICES_PER_ROUND));
  }
  return { seed, rounds, rerollSets };
}

/**
 * Validate that picks are legal for a board: 10 DISTINCT fighters, each chosen
 * from its round's base options OR any reroll set (a rerolled pick can land in
 * any round). Distinctness keeps the roster free of duplicates.
 */
export function validatePicks(board: Board, picks: string[]): boolean {
  if (picks.length !== board.rounds.length) return false;
  if (new Set(picks).size !== picks.length) return false; // no duplicate fighters
  const reserve = new Set(board.rerollSets.flat().map((f) => f.id));
  return board.rounds.every(
    (round, i) => round.options.some((f) => f.id === picks[i]) || reserve.has(picks[i]),
  );
}
