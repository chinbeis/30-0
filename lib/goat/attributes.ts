import type { Division, Fighter } from "@/lib/game/types";
import type { Category, CategoryKey, TraitKey } from "./types";

export const CATEGORIES: Category[] = [
  { key: "striking", label: "Striking", blurb: "Hands, kicks, knockout power" },
  { key: "wrestling", label: "Wrestling", blurb: "Takedowns and takedown defense" },
  { key: "submissions", label: "Submissions", blurb: "Grappling and the finish" },
  { key: "cardio", label: "Cardio", blurb: "The gas tank for deep rounds" },
  { key: "chin", label: "Chin", blurb: "Can they take a shot?" },
  { key: "fightIq", label: "Fight IQ", blurb: "Reads, adjustments, ring craft" },
  { key: "physique", label: "Physique", blurb: "Frame and natural division", physique: true },
];

export const TRAIT_KEYS: TraitKey[] = [
  "striking",
  "wrestling",
  "submissions",
  "cardio",
  "chin",
  "fightIq",
];

/** Numeric attribute a fighter contributes for a given trait category. */
export function attributeValue(f: Fighter, key: CategoryKey): number {
  switch (key) {
    case "striking":
      return f.striking;
    case "wrestling":
      return f.grappling;
    case "submissions":
      return Math.round((f.grappling + f.finishing) / 2);
    case "cardio":
      return f.cardio;
    case "chin":
      return f.durability;
    case "fightIq":
      return f.fightIq;
    default:
      return 0; // physique handled separately
  }
}

const SIZE: Record<Division, number> = {
  Flyweight: 1,
  Bantamweight: 2,
  Featherweight: 3,
  Lightweight: 4,
  Welterweight: 5,
  Middleweight: 6,
  "Light Heavyweight": 7,
  Heavyweight: 7,
  "Women's Strawweight": 1,
  "Women's Flyweight": 1,
  "Women's Bantamweight": 2,
};

export function divisionSize(division: Division): number {
  return SIZE[division] ?? 4;
}

/** Short qualitative tag for a fighter in a category (ratings stay hidden). */
export function traitTag(f: Fighter, key: CategoryKey): string {
  if (key === "physique") return f.division;
  const v = attributeValue(f, key);
  if (v >= 93) return "Elite";
  if (v >= 87) return "Great";
  if (v >= 80) return "Solid";
  if (v >= 70) return "Average";
  return "Suspect";
}
