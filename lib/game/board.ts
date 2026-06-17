import type { Fighter } from "./types";
import { FIGHTERS } from "./fighters";
import { rngFromSeed, shuffle } from "./rng";
import { ROSTER_SIZE } from "./engine";

export const CHOICES_PER_ROUND = 3;

export interface Round {
  round: number; // 1..10
  options: Fighter[]; // 3 fighters
}

export interface Board {
  seed: string;
  rounds: Round[];
}

/**
 * Build the 10-round board for a seed. Each round offers 3 distinct fighters and
 * no fighter appears twice across the whole board, so every run assembles a roster
 * of 10 unique fighters. Deterministic: same seed => same board (this is what makes
 * the Daily Challenge identical for everyone).
 */
export function buildBoard(seed: string): Board {
  const rng = rngFromSeed(seed);
  const pool = shuffle(rng, FIGHTERS);
  const needed = ROSTER_SIZE * CHOICES_PER_ROUND; // 30 distinct fighters
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
  return { seed, rounds };
}

/** Validate that a set of picks is legal for a board (one option chosen per round). */
export function validatePicks(board: Board, picks: string[]): boolean {
  if (picks.length !== board.rounds.length) return false;
  return board.rounds.every((round, i) =>
    round.options.some((f) => f.id === picks[i]),
  );
}
