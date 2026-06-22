// Core domain types for "Can You Go 30-0?"
// Pure data — no framework imports. Safe to use on server or client.

export type Division =
  | "Heavyweight"
  | "Light Heavyweight"
  | "Middleweight"
  | "Welterweight"
  | "Lightweight"
  | "Featherweight"
  | "Bantamweight"
  | "Flyweight"
  | "Women's Bantamweight"
  | "Women's Flyweight"
  | "Women's Strawweight";

/** Fighter "video-game" ratings, 0..100. These are authored/derived, NOT raw UFC stats. */
export interface Ratings {
  striking: number;
  grappling: number;
  cardio: number;
  durability: number;
  fightIq: number;
  experience: number;
  finishing: number;
}

export interface Fighter extends Ratings {
  id: string;
  name: string;
  nickname?: string;
  division: Division;
  era: string; // flavor for debate ("2010s", "Modern", "Pioneer")
  isPrime?: boolean; // rare boosted card (v1.1) — currently unused by the pool
}

/** Opponent archetype drives style-matchup modifiers. */
export type Archetype = "striker" | "wrestler" | "grappler" | "balanced";

export type Method =
  | "KO/TKO"
  | "Submission"
  | "Decision"
  | "Upset KO"
  | "Upset SUB"
  | "Upset Dec";

export interface FightResult {
  bout: number; // 1..30, in difficulty order (1 = easiest, 30 = final boss)
  fighterId: string;
  oppId: string; // a real opponent (same weight class, never the fighter itself)
  oppName: string;
  oppOvr: number;
  oppArchetype: Archetype;
  win: boolean;
  method: Method;
  winProb: number; // the pre-roll probability, for transparency/debug
}

export interface FighterSeason {
  fighterId: string;
  wins: number;
  losses: number;
  fights: FightResult[];
  avgOppBeaten: number; // strength of schedule among wins (0 if none)
  finishes: number;
}

export interface SeasonResult {
  wins: number;
  losses: number;
  record: string; // "30-0"
  goatScore: number; // 0..100
  tier: Tier;
  mvpFighterId: string;
  weakestFighterId: string;
  perFighter: FighterSeason[];
  fights: FightResult[]; // all 30, in order
  story: string;
  simSeed: string;
}

export interface Tier {
  label: string; // "IMMORTAL"
  blurb: string; // short flavor
}
