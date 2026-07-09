import { FIGHTERS, getFighter } from "@/lib/game/fighters";
import { CURRENT_FIGHTERS } from "@/lib/game/fighters-current";
import { EXTRA_FIGHTERS } from "@/lib/game/fighters-extended";
import { ovr } from "@/lib/game/engine";
import { rngFromSeed, type Rng } from "@/lib/game/rng";
import { attributeValue, divisionSize, physiqueValue, TRAIT_KEYS } from "./attributes";
import type {
  Archetype,
  BuildAttributes,
  CareerFight,
  CareerResult,
  CategoryKey,
  FightKind,
  Tier,
  TraitKey,
} from "./types";

// All extended fighters need to be resolvable by id alongside the core pool.
const EXTRA_BY_ID = Object.fromEntries(EXTRA_FIGHTERS.map((f) => [f.id, f]));
function fighterById(id: string) {
  return EXTRA_BY_ID[id] ?? getFighter(id);
}

/** Resolve any pool fighter (core + extended) by id — for UI display. */
export function getPoolFighter(id: string) {
  return fighterById(id);
}

export const CAREER_LENGTH = 13;

// ---------------------------------------------------------------------------
// Tuning — the gauntlet is deliberately brutal at the top (title + move-up
// fights are near coin-flips even for elite builds). Re-run the calibration
// test after changing any of these.
// ---------------------------------------------------------------------------

export const SCALE = 3.5; // lower = more deterministic (skill > luck); higher = more upsets

interface LadderNode {
  label: string;
  opp: number; // opponent effective rating
  kind: FightKind;
}

// Difficulty curve: the climb to your FIRST belt is gentle so an above-average
// build reliably becomes champion; the back half (defenses, move-ups, second &
// triple titles) steepens hard so an undefeated 13-0 run stays rare. The final
// boss is the wall. Re-run `npx vitest run lib/goat` after editing.
const LADDER: LadderNode[] = [
  { label: "Regional Prospect", opp: 45, kind: "normal" },
  { label: "Regional Veteran", opp: 50, kind: "normal" },
  { label: "UFC Debut", opp: 56, kind: "normal" },
  { label: "Top 15 Opponent", opp: 60, kind: "normal" },
  { label: "Top 10 Opponent", opp: 64, kind: "normal" },
  { label: "Top 5 Opponent", opp: 68, kind: "normal" },
  { label: "Title Eliminator", opp: 71, kind: "normal" },
  { label: "Title Fight", opp: 76, kind: "title" }, // first belt — reachable by good builds
  { label: "Title Defense", opp: 85, kind: "title" },
  { label: "Move Up a Division", opp: 91, kind: "moveup" },
  { label: "Second Title Fight", opp: 98, kind: "title" },
  { label: "Move Up Again", opp: 103, kind: "moveup" },
  { label: "Triple Champion Fight", opp: 111, kind: "title" }, // the final boss — the wall
];

const ARCHETYPES: Archetype[] = ["striker", "wrestler", "grappler", "balanced"];

/** The 13 career rungs (labels + kind) for UI rendering. */
export const CAREER_LADDER = LADDER.map((n) => ({ label: n.label, kind: n.kind }));

// ---------------------------------------------------------------------------
// Opponents (cosmetic — selected with a SEPARATE rng stream so the career sim's
// seeded rolls are untouched and calibration stays valid). Early/regional rungs
// face generated regional fighters; the title-level rungs face real *current*
// fighters of the (move-up-adjusted) weight class.
// ---------------------------------------------------------------------------

// Real opponents come from the current roster first, then the wider pool as a
// fallback for weight classes the current roster doesn't cover.
const REAL_OPP_POOL = [...CURRENT_FIGHTERS, ...FIGHTERS].map((f, i) => ({
  f,
  ovr: ovr(f),
  size: divisionSize(f.division),
  current: i < CURRENT_FIGHTERS.length,
}));

// A rung faces a real fighter once it's title/move-up or a genuine top contender.
function facesRealFighter(node: LadderNode): boolean {
  return node.kind !== "normal" || node.opp >= 79;
}

const OPP_FIRST = [
  "Jake", "Diego", "Yuki", "Marcus", "Bruno", "Ali", "Sergei", "Tyrone", "Pedro",
  "Kenta", "Liam", "Andre", "Rashad", "Hugo", "Mateus", "Dmitry", "Caio", "Sean",
  "Omar", "Viktor", "Tang", "Rafael", "Cole", "Ivan", "Mauricio", "Kai",
];
const OPP_LAST = [
  "Silva", "Tanaka", "Johnson", "Petrov", "Costa", "Khan", "Mendes", "Park",
  "Oliveira", "Novak", "Reyes", "Adesina", "Volkov", "Santos", "Nguyen", "Carter",
  "Ferreira", "Kowalski", "Diaz", "Okafor", "Lee", "Romero", "Bayo", "Suzuki",
];

function genRegionalName(rng: Rng): string {
  const first = OPP_FIRST[Math.floor(rng() * OPP_FIRST.length)];
  const last = OPP_LAST[Math.floor(rng() * OPP_LAST.length)];
  return `${first} ${last}`;
}

/** Name an opponent for a rung. Pure w.r.t. the career sim (uses `oppRng` only). */
function pickGoatOpponent(
  node: LadderNode,
  fighterSize: number,
  moveUps: number,
  oppRng: Rng,
  usedReal: Set<string>,
  usedNames: Set<string>,
): string {
  if (facesRealFighter(node)) {
    const size = Math.min(7, Math.max(1, fighterSize + moveUps));
    const byCloseness = (
      a: (typeof REAL_OPP_POOL)[number],
      b: (typeof REAL_OPP_POOL)[number],
    ) => Math.abs(a.ovr - node.opp) - Math.abs(b.ovr - node.opp) || a.f.id.localeCompare(b.f.id);

    const tiers = [
      REAL_OPP_POOL.filter((c) => c.current && c.size === size && !usedReal.has(c.f.id)),
      REAL_OPP_POOL.filter((c) => c.size === size && !usedReal.has(c.f.id)),
      REAL_OPP_POOL.filter((c) => c.current && !usedReal.has(c.f.id)),
      REAL_OPP_POOL.filter((c) => !usedReal.has(c.f.id)),
    ];
    const pool = tiers.find((t) => t.length) ?? REAL_OPP_POOL;
    const chosen = [...pool].sort(byCloseness)[0];
    usedReal.add(chosen.f.id);
    return chosen.f.name;
  }

  let name = genRegionalName(oppRng);
  for (let guard = 0; usedNames.has(name) && guard < 12; guard++) name = genRegionalName(oppRng);
  usedNames.add(name);
  return name;
}

// ---------------------------------------------------------------------------
// Build composition
// ---------------------------------------------------------------------------

export function composeFighter(picks: string[]): BuildAttributes {
  // picks aligned to CATEGORIES order: [striking, wrestling, submissions, cardio, chin, fightIq, physique]
  const [striking, wrestling, submissions, cardio, chin, fightIq, physique] = picks;
  const phys = fighterById(physique);
  const val = (id: string, key: CategoryKey) => attributeValue(fighterById(id), key);
  return {
    striking: val(striking, "striking"),
    wrestling: val(wrestling, "wrestling"),
    submissions: val(submissions, "submissions"),
    cardio: val(cardio, "cardio"),
    chin: val(chin, "chin"),
    fightIq: val(fightIq, "fightIq"),
    physique: physiqueValue(phys),
    division: phys.division,
    size: divisionSize(phys.division),
    sources: {
      striking,
      wrestling,
      submissions,
      cardio,
      chin,
      fightIq,
      physique,
    },
  };
}

// ---------------------------------------------------------------------------
// Synergies (depth + "broken builds" flavor)
// ---------------------------------------------------------------------------

// A maxed build could stack every combo below, so the positive sum is capped.
// More synergies = more PATHS to the cap for specialized builds, not a stronger
// ceiling. 14 was tuned empirically to keep the skilled 13-0 rate at ~3.5%
// (matching the pre-expansion calibration) — re-run `npx vitest run lib/goat`
// and re-tune this cap if you add/change combos.
const MAX_SYNERGY_BONUS = 14;

function synergyInfo(a: BuildAttributes): { bonus: number; names: string[] } {
  const names: string[] = [];
  let bonus = 0;
  if (a.wrestling >= 88 && a.cardio >= 88) {
    names.push("Rubber Guy");
    bonus += 5;
  }
  if (a.striking >= 90 && a.fightIq >= 88) {
    names.push("Long Rangy Sniper");
    bonus += 5;
  }
  if (a.submissions >= 88 && a.wrestling >= 85) {
    names.push("Spider Web Grappler");
    bonus += 5;
  }
  if (a.chin >= 90 && a.cardio >= 88) {
    names.push("Cardio Freak");
    bonus += 4;
  }
  if (a.striking >= 88 && a.wrestling >= 85) {
    names.push("Active Grappler");
    bonus += 4;
  }
  if (a.fightIq >= 92 && a.cardio >= 85) {
    names.push("Technical Maestro");
    bonus += 4;
  }
  if (a.striking >= 92 && a.physique >= 88) {
    names.push("Big Meaty Overhands");
    bonus += 4;
  }
  if (a.physique >= 90 && a.wrestling >= 85) {
    names.push("Division Bully");
    bonus += 3;
  }
  if (a.chin >= 90 && a.striking >= 88) {
    names.push("Eat and Trade");
    bonus += 3;
  }
  if (a.submissions >= 90 && a.fightIq >= 88) {
    names.push("Feint Merchant");
    bonus += 3;
  }
  // Smudge Grappler — a wrestler who never learned to strike; leans on the mat game.
  if (a.wrestling >= 90 && a.striking < 80) {
    names.push("Smudge Grappler");
    bonus += 4;
  }
  // Dirty Boxer — a small-division fighter (fly/bantam frame) with big power.
  if (a.size <= 3 && a.striking >= 88) {
    names.push("Ditty Boxer");
    bonus += 4;
  }
  // Scientist — a limited fighter with a giant brain and exactly ONE real weapon.
  {
    const weapons = [a.striking, a.wrestling, a.submissions];
    const good = weapons.filter((v) => v >= 85).length;
    const bad = weapons.filter((v) => v <= 78).length;
    if (a.fightIq >= 92 && good === 1 && bad === 2) {
      names.push("Scientist");
      bonus += 5;
    }
  }
  // Goofy Goober — nothing above 84 anywhere, but heart counts for something.
  if (
    a.striking < 85 &&
    a.wrestling < 85 &&
    a.submissions < 85 &&
    a.cardio < 85 &&
    a.chin < 85 &&
    a.fightIq < 85
  ) {
    names.push("Goofy Goober");
    bonus += 3;
  }
  bonus = Math.min(bonus, MAX_SYNERGY_BONUS);
  // Look Do See — every skill is very high. Flavor tag only: these builds already
  // eat the too-perfect penalty below, which keeps the game from being solved.
  if (
    a.striking >= 90 &&
    a.wrestling >= 90 &&
    a.submissions >= 90 &&
    a.cardio >= 90 &&
    a.chin >= 90 &&
    a.fightIq >= 90
  ) {
    names.push("Look Do See");
  }
  // diminishing returns: too-perfect builds are penalised (helps prevent a solved game)
  if (a.striking >= 88 && a.wrestling >= 88 && a.submissions >= 88) bonus -= 6;
  return { bonus, names };
}

// ---------------------------------------------------------------------------
// Resemblance — the real fighter your build most fights like
// ---------------------------------------------------------------------------

/** Compared in build-attribute space: the six skills + physique, equal weight. */
const RESEMBLANCE_KEYS: CategoryKey[] = [...TRAIT_KEYS, "physique"];

export interface Resemblance {
  fighterId: string;
  /** 0..100 — how close the build sits to that fighter's authored ratings. */
  match: number;
}

/**
 * Find the real fighter (core + extended pool) whose ratings are closest to the
 * composed build, restricted to a similar weight class: same division size, one
 * under, or one over. Pure + deterministic (id tiebreak) — safe to call in UI.
 */
export function resemblance(a: BuildAttributes): Resemblance {
  const pool = [...FIGHTERS, ...EXTRA_FIGHTERS].filter(
    (f) => Math.abs(divisionSize(f.division) - a.size) <= 1,
  );
  let bestId = pool[0].id;
  let bestDiff = Infinity;
  for (const f of pool) {
    const diff =
      RESEMBLANCE_KEYS.reduce((s, k) => s + Math.abs(attributeValue(f, k) - a[k]), 0) /
      RESEMBLANCE_KEYS.length;
    if (diff < bestDiff || (diff === bestDiff && f.id.localeCompare(bestId) < 0)) {
      bestId = f.id;
      bestDiff = diff;
    }
  }
  // An avg gap of 0 pts = 100%, 10 pts across the board = 80% — reads intuitively.
  const match = Math.max(0, Math.min(100, Math.round(100 - bestDiff * 2)));
  return { fighterId: bestId, match };
}

// ---------------------------------------------------------------------------
// Per-fight resolution
// ---------------------------------------------------------------------------

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Returns [performance, decidingAttribute candidate set]. */
function performance(a: BuildAttributes, arc: Archetype): { perf: number; weak: TraitKey } {
  let perf: number;
  let candidates: TraitKey[];
  switch (arc) {
    case "striker":
      perf = 0.5 * a.striking + 0.3 * a.chin + 0.2 * a.fightIq;
      candidates = ["striking", "chin"];
      break;
    case "wrestler":
      perf = 0.5 * a.wrestling + 0.3 * a.cardio + 0.2 * a.fightIq;
      candidates = ["wrestling", "cardio"];
      break;
    case "grappler":
      perf = 0.45 * a.submissions + 0.3 * a.wrestling + 0.25 * a.fightIq;
      candidates = ["submissions", "wrestling"];
      break;
    default: {
      const avg = (a.striking + a.wrestling + a.submissions + a.cardio + a.chin) / 5;
      perf = 0.8 * avg + 0.2 * a.fightIq;
      candidates = ["striking", "wrestling", "submissions", "cardio", "chin"];
    }
  }
  // A great physique is an always-on athletic edge; a poor one is a drag.
  perf += (a.physique - 80) * 0.25;
  // weak link = lowest relevant attribute
  const weak = candidates.reduce((lo, k) => (a[k] < a[lo] ? k : lo), candidates[0]);
  return { perf, weak };
}

/** Physique penalty for this fight (championship cardio strain + move-up size gap). */
function physiquePenalty(a: BuildAttributes, kind: FightKind, moveUpsSoFar: number): number {
  let pen = 0;
  // A fighter who's well-built for their class carries size up and holds up in
  // the championship rounds; an undersized/soft frame pays for it.
  const physEdge = (a.physique - 80) / 100; // ~ -0.35 .. +0.17
  if (kind === "title") {
    // bigger frame + worse cardio gasses in the championship rounds
    pen += a.size * (1 - a.cardio / 100) * 5;
    pen -= physEdge * 7; // built-for-the-class frames fade less
  }
  if (kind === "moveup") {
    // smaller fighters get bullied moving up; compounding with each move
    pen += moveUpsSoFar * (1 - a.size / 7) * 9;
    pen -= physEdge * moveUpsSoFar * 5; // physical specimens move up better
  }
  return Math.max(0, pen);
}

function methodFor(win: boolean, arc: Archetype, a: BuildAttributes, rng: Rng): string {
  if (!win) {
    if (arc === "striker" && rng() < 0.5) return "lost by KO";
    if ((arc === "grappler" || arc === "wrestler") && rng() < 0.4) return "lost by submission";
    return "lost a decision";
  }
  const finishLean = arc === "striker" ? a.striking : arc === "grappler" ? a.submissions : a.wrestling;
  if (rng() < finishLean / 100 - 0.2) {
    return arc === "striker" ? "won by KO" : arc === "grappler" ? "won by submission" : "won by TKO";
  }
  return "won by decision";
}

// ---------------------------------------------------------------------------
// Career simulation (ends at first loss — it's an undefeated run)
// ---------------------------------------------------------------------------

export interface SimInput {
  picks: string[];
  seed: string;
}

export function simulateCareer({ picks, seed }: SimInput): CareerResult {
  if (picks.length !== 7) throw new Error(`Expected 7 picks, got ${picks.length}`);
  const a = composeFighter(picks);
  const rng = rngFromSeed(seed);
  // Separate stream for opponent naming so it never shifts the career rolls above.
  const oppRng = rngFromSeed(`${seed}:goatopp`);
  const usedReal = new Set<string>();
  const usedNames = new Set<string>();
  const syn = synergyInfo(a);

  const fights: CareerFight[] = [];
  let wins = 0;
  let lost = false;
  let titlesWon = 0;
  let moveUps = 0;

  for (let i = 0; i < CAREER_LENGTH; i++) {
    const node = LADDER[i];
    const arc = ARCHETYPES[Math.floor(rng() * ARCHETYPES.length)];
    const { perf, weak } = performance(a, arc);
    if (node.kind === "moveup") moveUps++;
    const pen = physiquePenalty(a, node.kind, moveUps);
    const edge = perf + syn.bonus - pen - node.opp;
    const winProb = logistic(edge / SCALE);
    const win = rng() < winProb;
    const method = methodFor(win, arc, a, rng);
    const oppName = pickGoatOpponent(node, a.size, moveUps, oppRng, usedReal, usedNames);

    fights.push({
      fight: i + 1,
      label: node.label,
      kind: node.kind,
      archetype: arc,
      oppRating: node.opp,
      oppName,
      win,
      winProb,
      method,
      decidingAttribute: win ? null : weak,
    });

    if (win) {
      wins++;
      if (node.kind === "title") titlesWon++;
    } else {
      lost = true;
      break; // the dream ends at the first loss
    }
  }

  return finalize(a, fights, wins, lost, titlesWon, syn.names, seed);
}

// ---------------------------------------------------------------------------
// Result assembly
// ---------------------------------------------------------------------------

const TIERS: { min: number; tier: Tier }[] = [
  { min: 13, tier: { label: "THE GOAT", blurb: "13-0. Triple champion. Untouchable." } },
  { min: 12, tier: { label: "DOUBLE CHAMPION", blurb: "Two belts — one fight from immortality." } },
  { min: 10, tier: { label: "CHAMPION", blurb: "You wear UFC gold." } },
  { min: 7, tier: { label: "CONTENDER", blurb: "Knocking on the title door." } },
  { min: 4, tier: { label: "PROSPECT", blurb: "Promising, but the climb is steep." } },
  { min: 0, tier: { label: "AMATEUR", blurb: "Back to the regionals." } },
];

function tierFor(wins: number): Tier {
  return TIERS.find((t) => wins >= t.min)!.tier;
}

const ATTR_LABEL: Record<CategoryKey, string> = {
  striking: "Striking",
  wrestling: "Wrestling",
  submissions: "Submissions",
  cardio: "Cardio",
  chin: "Chin",
  fightIq: "Fight IQ",
  physique: "Physique",
};

// Identity-defining synergies (most distinctive first). A build that earns one
// of these IS that archetype — it takes over the "You built" label. Broad combos
// like Technical Maestro / Cardio Freak stay in the fallback below instead, so
// every elite build doesn't collapse into the same name.
const SYNERGY_ARCHETYPES: { synergy: string; name: string }[] = [
  { synergy: "Look Do See", name: "Look Do See" },
  { synergy: "Goofy Goober", name: "The Goofy Goober" },
  { synergy: "Scientist", name: "The Scientist" },
  { synergy: "Smudge Grappler", name: "The Smudge Grappler" },
  { synergy: "Dirty Boxer", name: "The Dirty Boxer" },
];

function archetypeName(a: BuildAttributes, synergies: string[]): string {
  const special = SYNERGY_ARCHETYPES.find((s) => synergies.includes(s.synergy));
  if (special) return special.name;

  const ranked = TRAIT_KEYS.map((k) => ({ k, v: a[k] })).sort((x, y) => y.v - x.v);
  const top = ranked[0].k;
  const second = ranked[1].k;
  const NAMES: Partial<Record<CategoryKey, string>> = {
    striking: "Striker",
    wrestling: "Wrestler",
    submissions: "Grappler",
    cardio: "Engine",
    chin: "Tank",
    fightIq: "Tactician",
  };
  const a1 = NAMES[top] ?? "Fighter";
  const a2 = NAMES[second] ?? "";
  if (top === "striking" && second === "wrestling") return "The Wrestle-Boxer";
  if (top === "wrestling" && (second === "cardio" || second === "submissions"))
    return "The Smothering Machine";
  if (top === "striking" && second === "fightIq") return "The Sniper";
  if (top === "submissions") return "The Submission Wizard";
  if (top === "fightIq") return "The Technical Maestro";
  if ((top === "cardio" && second === "chin") || (top === "chin" && second === "cardio"))
    return "The Cardio Freak";
  return `The ${a2 ? a2 + " " : ""}${a1}`;
}

function finalize(
  a: BuildAttributes,
  fights: CareerFight[],
  wins: number,
  lost: boolean,
  titlesWon: number,
  synergies: string[],
  seed: string,
): CareerResult {
  const traitVals = TRAIT_KEYS.map((k) => ({ k, v: a[k] }));
  const strongest = traitVals.reduce((hi, x) => (x.v > hi.v ? x : hi));
  const weakest = traitVals.reduce((lo, x) => (x.v < lo.v ? x : lo));

  const lossFight = fights.find((f) => !f.win) ?? null;
  const decidingLoss =
    lossFight && lossFight.decidingAttribute
      ? {
          attribute: lossFight.decidingAttribute,
          source: fighterById(a.sources[lossFight.decidingAttribute]).name,
          fightLabel: lossFight.label,
        }
      : null;

  const goatScore = computeGoat(a);
  const tier = tierFor(wins);
  const name = archetypeName(a, synergies);

  return {
    wins,
    losses: lost ? 1 : 0,
    record: `${wins}-${lost ? 1 : 0}`,
    titlesWon,
    tier,
    goatScore,
    archetypeName: name,
    biggestStrength: {
      attribute: strongest.k,
      value: strongest.v,
      source: fighterById(a.sources[strongest.k]).name,
    },
    biggestWeakness: {
      attribute: weakest.k,
      value: weakest.v,
      source: fighterById(a.sources[weakest.k]).name,
    },
    decidingLoss,
    synergies,
    fights,
    attributes: a,
    narrative: buildNarrative(name, wins, lost, titlesWon, decidingLoss),
    simSeed: seed,
  };
}

/**
 * GOAT score = the quality of the BUILD itself — the average of the 7 traits you
 * picked (the 6 combat attributes + physique). It measures *how good a fighter
 * you assembled*, independent of how far the career sim happened to carry it.
 */
function computeGoat(a: BuildAttributes): number {
  const selections = [
    a.striking,
    a.wrestling,
    a.submissions,
    a.cardio,
    a.chin,
    a.fightIq,
    a.physique,
  ];
  const avg = selections.reduce((s, v) => s + v, 0) / selections.length;
  return Math.max(0, Math.min(100, Math.round(avg)));
}

function buildNarrative(
  name: string,
  wins: number,
  lost: boolean,
  titlesWon: number,
  decidingLoss: CareerResult["decidingLoss"],
): string {
  if (!lost && wins === 13) {
    return `${name} ran the table — 13-0, three divisions, every belt. The flaws never showed. This is the GOAT debate, settled.`;
  }
  const belts = titlesWon === 0 ? "never reached gold" : `captured ${titlesWon} title${titlesWon > 1 ? "s" : ""}`;
  if (decidingLoss) {
    return `${name} ${belts}, then it unravelled at the ${decidingLoss.fightLabel}: ${ATTR_LABEL[decidingLoss.attribute]} — inherited from ${decidingLoss.source} — was the flaw. ${wins}-1. One better choice and this is a different story.`;
  }
  return `${name} ${belts}. The run ended at ${wins}-1.`;
}

export { ATTR_LABEL };
