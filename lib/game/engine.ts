import type {
  Archetype,
  Fighter,
  FightResult,
  FighterSeason,
  Method,
  Ratings,
  SeasonResult,
  Tier,
} from "./types";
import { getFighter } from "./fighters";
import { rngFromSeed, type Rng } from "./rng";

// ----------------------------------------------------------------------------
// Tunable constants — THE feel of the game lives here. See calibration test.
// ----------------------------------------------------------------------------

export const ROSTER_SIZE = 10;
export const BOUTS_PER_FIGHTER = 3;
export const TOTAL_BOUTS = ROSTER_SIZE * BOUTS_PER_FIGHTER; // 30

/**
 * Logistic scale. Smaller => more deterministic (favorites always win, near-misses
 * come only from weak picks). Larger => more upsets/variance. This single number,
 * with the opponent curve below, sets how often a strong roster hits 30-0.
 */
export const SCALE = 4.2;

/** Opponent OVR curve across the 30 bouts (sorted easiest -> final boss). */
const OPP_OVR_MIN = 60; // bout 1
const OPP_OVR_MAX = 90; // bout 30 (title fight / final boss)

// OVR weighting — strikes a balance between offense and the "stay unbeaten" traits.
const OVR_WEIGHTS: Ratings = {
  striking: 0.2,
  grappling: 0.2,
  cardio: 0.16,
  durability: 0.14,
  fightIq: 0.12,
  experience: 0.08,
  finishing: 0.1,
};

// ----------------------------------------------------------------------------
// Ratings -> overall
// ----------------------------------------------------------------------------

export function ovr(f: Ratings): number {
  return (
    f.striking * OVR_WEIGHTS.striking +
    f.grappling * OVR_WEIGHTS.grappling +
    f.cardio * OVR_WEIGHTS.cardio +
    f.durability * OVR_WEIGHTS.durability +
    f.fightIq * OVR_WEIGHTS.fightIq +
    f.experience * OVR_WEIGHTS.experience +
    f.finishing * OVR_WEIGHTS.finishing
  );
}

// ----------------------------------------------------------------------------
// Schedule
// ----------------------------------------------------------------------------

const ARCHETYPES: Archetype[] = ["striker", "wrestler", "grappler", "balanced"];

interface Bout {
  bout: number; // 1..30
  oppOvr: number;
  oppArchetype: Archetype;
}

/** Build 30 bouts, difficulty ramping from tune-ups to a title run. */
function buildSchedule(rng: Rng): Bout[] {
  const bouts: Bout[] = [];
  for (let i = 0; i < TOTAL_BOUTS; i++) {
    const t = i / (TOTAL_BOUTS - 1);
    // Slight late steepening so the final ~10 fights (the "title run") bite hardest.
    const curved = Math.pow(t, 1.25);
    const oppOvr = OPP_OVR_MIN + curved * (OPP_OVR_MAX - OPP_OVR_MIN);
    bouts.push({
      bout: i + 1,
      oppOvr: Math.round(oppOvr),
      oppArchetype: ARCHETYPES[Math.floor(rng() * ARCHETYPES.length)],
    });
  }
  return bouts;
}

/**
 * Style matchup modifier (added to the fighter's effective edge).
 * Small by design — believability + debate flavor, not a coin flip.
 */
function styleModifier(f: Fighter, opp: Archetype): number {
  const strikerLean = f.striking - f.grappling; // + => striker, - => grappler
  switch (opp) {
    case "wrestler":
      // Wrestlers smother strikers with weak takedown defense; grapplers neutralize them.
      return f.grappling >= 85 ? 4 : strikerLean > 10 ? -5 : 0;
    case "grappler":
      // Elite strikers keep it standing; pure strikers risk the submission.
      return f.striking >= 90 ? 4 : strikerLean < -10 ? 3 : strikerLean > 15 ? -4 : 0;
    case "striker":
      // Cardio + durability decide firefights; one-dimensional grapplers struggle.
      return f.durability >= 88 ? 4 : strikerLean < -15 ? -4 : 2;
    default:
      return 0;
  }
}

// ----------------------------------------------------------------------------
// Single fight
// ----------------------------------------------------------------------------

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function pickMethod(f: Fighter, win: boolean, isUpset: boolean, rng: Rng): Method {
  const strikerLean = f.striking - f.grappling;
  // Did it finish? More likely with high finishing rating.
  const finished = rng() < f.finishing / 100 - 0.15;
  if (win) {
    if (!finished) return "Decision";
    return strikerLean >= 0 ? "KO/TKO" : "Submission";
  }
  // loss
  if (isUpset) {
    if (!finished) return "Upset Dec";
    return rng() < 0.5 ? "Upset KO" : "Upset SUB";
  }
  return "Decision";
}

function simFight(f: Fighter, bout: Bout, rng: Rng): FightResult {
  const fOvr = ovr(f);
  const edge = fOvr - bout.oppOvr + styleModifier(f, bout.oppArchetype);
  const winProb = logistic(edge / SCALE);
  const win = rng() < winProb;
  const isUpset = !win && fOvr > bout.oppOvr; // favorite who lost
  const method = pickMethod(f, win, isUpset, rng);
  return {
    bout: bout.bout,
    fighterId: f.id,
    oppOvr: bout.oppOvr,
    oppArchetype: bout.oppArchetype,
    win,
    method,
    winProb,
  };
}

// ----------------------------------------------------------------------------
// Season
// ----------------------------------------------------------------------------

const TIERS: { maxLosses: number; tier: Tier }[] = [
  { maxLosses: 0, tier: { label: "IMMORTAL", blurb: "Perfect. 30-0. Nobody can argue." } },
  { maxLosses: 1, tier: { label: "HALL OF FAMER", blurb: "One round from immortality." } },
  { maxLosses: 3, tier: { label: "CHAMPION", blurb: "A dominant title reign." } },
  { maxLosses: 6, tier: { label: "CONTENDER", blurb: "Top of the division, not quite the throne." } },
  { maxLosses: 10, tier: { label: "JOURNEYMAN", blurb: "Tough outs, but the gaps showed." } },
  { maxLosses: 30, tier: { label: "GATEKEEPER", blurb: "Back to the drawing board." } },
];

function tierFor(losses: number): Tier {
  return TIERS.find((t) => losses <= t.maxLosses)!.tier;
}

/**
 * GOAT score 0..100. Wins dominate; finish rate and strength-of-schedule add polish.
 * 30-0 with finishes lands in the high 90s; a weak 21-9 lands in the 50s.
 */
function goatScore(seasons: FighterSeason[], wins: number): number {
  const finishes = seasons.reduce((s, f) => s + f.finishes, 0);
  const finishRate = wins > 0 ? finishes / wins : 0;
  const beaten = seasons.flatMap((f) => f.fights.filter((x) => x.win).map((x) => x.oppOvr));
  const avgQuality = beaten.length ? beaten.reduce((a, b) => a + b, 0) / beaten.length : 0;

  const winPart = (wins / TOTAL_BOUTS) * 72; // up to 72
  const finishPart = finishRate * 16; // up to 16
  const qualityPart = (Math.max(0, avgQuality - 60) / 30) * 12; // up to 12
  return Math.max(0, Math.min(100, Math.round(winPart + finishPart + qualityPart)));
}

function buildStory(
  roster: Fighter[],
  fights: FightResult[],
  wins: number,
  losses: number,
): string {
  const byId = Object.fromEntries(roster.map((f) => [f.id, f]));
  // Identify the team's identity (its best stat across the roster).
  const totals = roster.reduce(
    (acc, f) => {
      acc.striking += f.striking;
      acc.grappling += f.grappling;
      acc.cardio += f.cardio;
      return acc;
    },
    { striking: 0, grappling: 0, cardio: 0 },
  );
  let identity = "all-around balance";
  if (totals.grappling >= totals.striking && totals.grappling >= totals.cardio)
    identity = "elite grappling and wrestling";
  else if (totals.striking >= totals.cardio) identity = "knockout striking power";
  else identity = "a relentless cardio pace";

  if (losses === 0) {
    return `Your roster ran the table on ${identity} — 30-0, untouched. Every title fight, answered. This is the team they'll argue about for years.`;
  }

  // The most painful loss = the latest-bout defeat (deepest into the title run).
  const losingFights = fights.filter((x) => !x.win).sort((a, b) => b.bout - a.bout);
  const keyLoss = losingFights[0];
  const culprit = byId[keyLoss.fighterId];
  const reason = lossReason(culprit, keyLoss.method);
  const lossWord = losses === 1 ? "one blemish" : `${losses} losses`;

  return `Your team carried ${identity} deep into the season. Then Fight ${keyLoss.bout}: ${culprit.name} ${reason}. Final record ${wins}-${losses} — ${lossWord} between you and perfection.`;
}

function lossReason(f: Fighter, method: Method): string {
  if (method.includes("KO")) {
    return f.durability < 82 ? "got caught and dropped — the chin finally cracked" : "ate a perfect shot on the feet";
  }
  if (method.includes("SUB")) {
    return f.grappling < 80 ? "was dragged down and tapped" : "got caught in a scramble";
  }
  // decision
  if (f.cardio < 84) return "gassed in the championship rounds and lost the decision";
  return "dropped a razor-thin decision";
}

export interface SimInput {
  picks: string[]; // 10 fighter ids
  seed: string; // sim seed (e.g. runId or `${boardDate}:${userId}`)
}

export function simulateSeason({ picks, seed }: SimInput): SeasonResult {
  if (picks.length !== ROSTER_SIZE) {
    throw new Error(`Expected ${ROSTER_SIZE} picks, got ${picks.length}`);
  }
  const roster = picks.map(getFighter);
  const rng = rngFromSeed(seed);
  const schedule = buildSchedule(rng);

  // Round-robin assignment: fighter (boutIndex % 10). Since the schedule is sorted
  // easiest->hardest, each fighter draws a spread of difficulties INCLUDING one
  // deep title-run fight — so a single weak pick reliably drops its hard bout,
  // which is exactly the "this one choice cost me" mechanic.
  const perFighterFights: Record<string, FightResult[]> = {};
  roster.forEach((f) => (perFighterFights[f.id] = []));
  const allFights: FightResult[] = [];

  schedule.forEach((bout, i) => {
    const fighter = roster[i % ROSTER_SIZE];
    const result = simFight(fighter, bout, rng);
    allFights.push(result);
    perFighterFights[fighter.id].push(result);
  });

  const perFighter: FighterSeason[] = roster.map((f) => {
    const fs = perFighterFights[f.id];
    const w = fs.filter((x) => x.win);
    const beaten = w.map((x) => x.oppOvr);
    return {
      fighterId: f.id,
      wins: w.length,
      losses: fs.length - w.length,
      fights: fs,
      finishes: w.filter((x) => x.method === "KO/TKO" || x.method === "Submission").length,
      avgOppBeaten: beaten.length ? beaten.reduce((a, b) => a + b, 0) / beaten.length : 0,
    };
  });

  const wins = allFights.filter((x) => x.win).length;
  const losses = TOTAL_BOUTS - wins;

  // MVP: best record, tiebreak by hardest schedule beaten, then finishes.
  const mvp = [...perFighter].sort(
    (a, b) =>
      b.wins - a.wins ||
      b.avgOppBeaten - a.avgOppBeaten ||
      b.finishes - a.finishes,
  )[0];
  // Weakest: worst record, tiebreak by easiest losses (lowest opp OVR faced).
  const weakest = [...perFighter].sort(
    (a, b) => a.wins - b.wins || a.avgOppBeaten - b.avgOppBeaten,
  )[0];

  const tier = tierFor(losses);
  return {
    wins,
    losses,
    record: `${wins}-${losses}`,
    goatScore: goatScore(perFighter, wins),
    tier,
    mvpFighterId: mvp.fighterId,
    weakestFighterId: weakest.fighterId,
    perFighter,
    fights: allFights,
    story: buildStory(roster, allFights, wins, losses),
    simSeed: seed,
  };
}
