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

// ---------------------------------------------------------------------------
// Physique — how physically gifted a fighter is FOR THEIR OWN weight class:
// frame, raw power, athleticism, "built different". This is a SEPARATE axis from
// skill (Yoel Romero is a physical specimen at MW; Roy Nelson is not), so it's
// authored as an override map for the standouts and derived for everyone else.
// Capped at 95; only generational freaks (Ngannou) breach it.
// ---------------------------------------------------------------------------
const PHYSIQUE_OVERRIDE: Record<string, number> = {
  // generational / division-bully physiques
  ngannou: 97, // freak power + frame
  mythic_poirier: 95, // "retired body" — somehow more jacked at the airport
  romero: 95, // olympic wrestler, absurdly built for 185
  usman: 92,
  jones: 92, // frame + 84.5" reach
  khabib: 90,
  gsp: 91,
  pereira: 91, // huge frame cut down to LHW
  aspinall: 91, // athletic for a HW
  chimaev: 90,
  shavkat: 89,
  gane: 89, // light-footed big man
  blaydes: 88,
  almeida: 86,
  rountree: 89, // jacked
  ulberg: 88,
  nunes: 90,
  kayla: 89, // physically dominant
  cejudo: 88, // olympic-level athlete
  merab: 87, // relentless engine/frame
  gaethje: 86,
  topuria: 86, // dense power at FW
  volkanovski: 85,
  zhang: 85,
  ddp: 85,
  ankalaev: 86,
  hill: 85,
  costa: 88, // bodybuilder frame
  buckley: 86, // elite athlete
  // lean / lanky — long but not "bully" strong
  adesanya: 82,
  prochazka: 80,
  holloway: 81,
  oliveira: 78,
  sandhagen: 79,
  diaz: 74, // lanky, durable, not powerful
  // smaller / softer / aging frames
  roynelson: 58, // round "Big Country" build
  markhunt: 70, // stocky power, low athleticism
  werdum: 68,
  faber: 74,
  cruz: 73,
  guida: 70,
  bonnar: 66,
  forrest: 72,
  bisping: 74,
  cerrone: 76,
  pettis: 76,
  arlovski: 74,
};

/** 0..100 physique rating for a fighter within their own division. */
export function physiqueValue(f: Fighter): number {
  const override = PHYSIQUE_OVERRIDE[f.id];
  if (override != null) return override;
  // Derive from the "physical" ratings: frame/toughness, power, explosiveness.
  const derived = Math.round(0.5 * f.durability + 0.3 * f.finishing + 0.2 * f.striking);
  return Math.max(45, Math.min(95, derived));
}

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
    case "physique":
      return physiqueValue(f);
    default:
      return 0;
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
  if (key === "physique") return physiqueTag(f);
  const v = attributeValue(f, key);
  if (v >= 96) return "Generational";
  if (v >= 91) return "Elite";
  if (v >= 86) return "Championship";
  if (v >= 81) return "Dangerous";
  if (v >= 75) return "Solid";
  if (v >= 68) return "Serviceable";
  return "Exposed";
}

/** Physique-specific qualitative tag (frame/power/athleticism for the class). */
export function physiqueTag(f: Fighter): string {
  const v = physiqueValue(f);
  if (v >= 95) return "Physical Freak";
  if (v >= 88) return "Division Bully";
  if (v >= 82) return "Well-Built";
  if (v >= 75) return "Solid Frame";
  if (v >= 68) return "Undersized";
  return "Outmuscled";
}
