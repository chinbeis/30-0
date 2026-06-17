import type { Division } from "@/lib/game/types";

// "Can You Become the GOAT?" — build one fighter from traits, run a 13-fight
// undefeated gauntlet to triple champ. Pure, deterministic, framework-free.

/** The six numeric attribute keys (everything except physique). */
export type TraitKey =
  | "striking"
  | "wrestling"
  | "submissions"
  | "cardio"
  | "chin"
  | "fightIq";

export type CategoryKey = TraitKey | "physique";

export interface Category {
  key: CategoryKey;
  label: string;
  blurb: string;
  physique?: boolean;
}

/** The fused fighter's numeric attributes (0..100) plus physique. */
export interface BuildAttributes {
  striking: number;
  wrestling: number;
  submissions: number;
  cardio: number;
  chin: number;
  fightIq: number;
  division: Division;
  size: number; // 1 (flyweight) .. 7 (heavyweight)
  /** which fighter each attribute came from (for "your chin was X's") */
  sources: Record<CategoryKey, string>;
}

export type FightKind = "normal" | "title" | "moveup";
export type Archetype = "striker" | "wrestler" | "grappler" | "balanced";

export interface CareerFight {
  fight: number; // 1..13
  label: string;
  kind: FightKind;
  archetype: Archetype;
  oppRating: number;
  win: boolean;
  winProb: number;
  method: string;
  decidingAttribute: CategoryKey | null; // on a loss, the weak link exploited
}

export interface Tier {
  label: string;
  blurb: string;
}

export interface CareerResult {
  wins: number;
  losses: number; // 0 or 1 (career ends at first loss)
  record: string;
  titlesWon: number;
  tier: Tier;
  goatScore: number; // 0..100
  archetypeName: string; // "The Pressure Wrestler"
  biggestStrength: { attribute: CategoryKey; value: number; source: string };
  biggestWeakness: { attribute: CategoryKey; value: number; source: string };
  decidingLoss: { attribute: CategoryKey; source: string; fightLabel: string } | null;
  synergies: string[];
  fights: CareerFight[];
  attributes: BuildAttributes;
  narrative: string;
  simSeed: string;
}
