import type { Fighter } from "@/lib/game/types";
import { FIGHTERS } from "@/lib/game/fighters";
import { EXTRA_FIGHTERS } from "@/lib/game/fighters-extended";
import { rngFromSeed, shuffle } from "@/lib/game/rng";
import { CATEGORIES } from "./attributes";
import type { CategoryKey } from "./types";

export const CHOICES_PER_ROUND = 3;
export const REROLLS_TOTAL = 3; // shared budget across the WHOLE draft, not per round
// Each round can hold up to 4 pages because a player could spend all 3 rerolls here.
export const PAGES = 1 + REROLLS_TOTAL;

/** Wider pool (legends + current top-10 + mid/low tier) so triples vary widely. */
export const GOAT_POOL: Fighter[] = [...FIGHTERS, ...EXTRA_FIGHTERS];

export interface BuildRound {
  category: CategoryKey;
  label: string;
  blurb: string;
  physique: boolean;
  /** PAGES sets of CHOICES_PER_ROUND fighters: index 0 is the initial deal, 1+ are rerolls. */
  pages: Fighter[][];
}

export interface BuildBoard {
  seed: string;
  rounds: BuildRound[];
}

function pagesFor(pool: Fighter[], physique: boolean): Fighter[][] {
  const pages: Fighter[][] = [];
  let idx = 0;
  for (let p = 0; p < PAGES; p++) {
    const opts: Fighter[] = [];
    const divs = new Set<string>();
    while (opts.length < CHOICES_PER_ROUND && idx < pool.length) {
      const f = pool[idx++];
      if (physique) {
        if (divs.has(f.division)) continue; // each physique page = 3 distinct divisions
        divs.add(f.division);
      }
      opts.push(f);
    }
    pages.push(opts);
  }
  return pages;
}

/**
 * Deterministic 7-round board, each round with PAGES sets of options (initial +
 * rerolls). Each round draws from its own seeded shuffle, so rerolls are
 * reproducible (same seed => same options on every roll). Same seed => same board.
 */
export function buildBuildBoard(seed: string): BuildBoard {
  const rounds: BuildRound[] = CATEGORIES.map((cat, i) => {
    const rng = rngFromSeed(`${seed}:r${i}`);
    const pool = shuffle(rng, GOAT_POOL);
    return {
      category: cat.key,
      label: cat.label,
      blurb: cat.blurb,
      physique: !!cat.physique,
      pages: pagesFor(pool, !!cat.physique),
    };
  });
  return { seed, rounds };
}

/** A pick is legal if it appears in any page (any roll) of its round. */
export function validateBuildPicks(board: BuildBoard, picks: string[]): boolean {
  if (picks.length !== board.rounds.length) return false;
  return board.rounds.every((r, i) => r.pages.some((page) => page.some((f) => f.id === picks[i])));
}
