import { describe, it, expect } from "vitest";
import { buildBoard, validatePicks, CHOICES_PER_ROUND, REROLLS_TOTAL, type Board } from "./board";
import { simulateSeason, ovr, ROSTER_SIZE, seasonSchedule, slotWinProbs } from "./engine";
import { getFighter, primeVariant, PRIME_SUFFIX } from "./fighters";

describe("buildBoard", () => {
  it("is deterministic per seed", () => {
    expect(buildBoard("2026-06-17")).toEqual(buildBoard("2026-06-17"));
  });

  it("produces 10 rounds of 3 distinct fighters, no repeats across the board", () => {
    const board = buildBoard("dist-check");
    expect(board.rounds).toHaveLength(ROSTER_SIZE);
    const seen = new Set<string>();
    for (const round of board.rounds) {
      expect(round.options).toHaveLength(CHOICES_PER_ROUND);
      for (const f of round.options) {
        expect(seen.has(f.id)).toBe(false);
        seen.add(f.id);
      }
    }
  });

  it("mythic cards land on ~50% of boards, at most one, resolvable, no duplicate human", () => {
    let withMythic = 0;
    for (let i = 0; i < 400; i++) {
      const board = buildBoard(`myth-${i}`);
      const all = [...board.rounds.flatMap((r) => r.options), ...board.rerollSets.flat()];
      const mythics = all.filter((f) => f.isMythic);
      expect(mythics.length).toBeLessThanOrEqual(1); // at most ONE per board
      if (!mythics.length) continue;
      withMythic++;
      const m = mythics[0];
      expect(m.id.startsWith("mythic_")).toBe(true);
      expect(getFighter(m.id)).toEqual(m); // drafted id resolves for sim/validation
      // The base version must not also be on the board (no two of the same human).
      const base = m.id.replace(/^mythic_/, "");
      expect(all.some((f) => f.id === base || f.id === `${base}${PRIME_SUFFIX}`)).toBe(false);
    }
    const rate = withMythic / 400;
    expect(rate).toBeGreaterThan(0.38); // rare...
    expect(rate).toBeLessThan(0.62); // ...but not too rare (~50%)
  });

  it("a roster with a mythic validates and simulates (mythic never fights its base self)", () => {
    for (let i = 0; i < 100; i++) {
      const board = buildBoard(`myth-play-${i}`);
      const round = board.rounds.findIndex((r) => r.options.some((f) => f.isMythic));
      if (round < 0) continue;
      const picks = board.rounds.map(
        (r, ri) => (ri === round ? r.options.find((f) => f.isMythic)! : r.options[0]).id,
      );
      expect(validatePicks(board, picks)).toBe(true);
      const res = simulateSeason({ picks, seed: `myth-sim-${i}` });
      expect(res.wins + res.losses).toBe(30);
      const mythicId = picks[round];
      for (const fight of res.fights.filter((x) => x.fighterId === mythicId)) {
        expect(fight.oppId).not.toBe(mythicId.replace(/^mythic_/, ""));
      }
      return;
    }
    throw new Error("no board with a mythic in 100 seeds");
  });

  it("prime cards are deterministic, legends-only, boosted, and rare (~1/board)", () => {
    // Determinism: same seed → identical prime placement.
    expect(buildBoard("prime-det")).toEqual(buildBoard("prime-det"));

    let primes = 0;
    let boards = 0;
    for (let i = 0; i < 300; i++) {
      const board = buildBoard(`prime-${i}`);
      boards++;
      const all = [...board.rounds.flatMap((r) => r.options), ...board.rerollSets.flat()];
      for (const f of all) {
        if (!f.isPrime) continue;
        primes++;
        expect(f.id.endsWith(PRIME_SUFFIX)).toBe(true);
        expect(f.era).not.toBe("Modern"); // primes are the OLDER versions only
        expect(f.name.startsWith("Prime ")).toBe(true);
        // A drafted prime id must resolve through getFighter and validate.
        expect(getFighter(f.id).isPrime).toBe(true);
      }
    }
    const perBoard = primes / boards;
    expect(perBoard).toBeGreaterThan(0.3); // they actually show up
    expect(perBoard).toBeLessThan(2.5); // but stay rare/special
  });

  it("a roster containing a prime card validates and simulates", () => {
    // Find a board whose base options include a prime, draft it, run the season.
    for (let i = 0; i < 200; i++) {
      const board = buildBoard(`prime-play-${i}`);
      const hasPrime = board.rounds.some((r) => r.options.some((f) => f.isPrime));
      if (!hasPrime) continue;
      const picks = board.rounds.map(
        (r) => (r.options.find((f) => f.isPrime) ?? r.options[0]).id,
      );
      expect(validatePicks(board, picks)).toBe(true);
      const res = simulateSeason({ picks, seed: `prime-sim-${i}` });
      expect(res.wins + res.losses).toBe(30);
      // Prime never fights its own base self.
      for (const fight of res.fights) {
        expect(fight.oppId).not.toBe(fight.fighterId.replace(PRIME_SUFFIX, ""));
      }
      return;
    }
    throw new Error("no board with a prime in 200 seeds — PRIME_CHANCE too low?");
  });

  it("primeVariant boosts every rating by +4 capped at 99", () => {
    const fedor = getFighter("fedor");
    const prime = primeVariant(fedor);
    expect(prime.striking).toBe(Math.min(99, fedor.striking + 4));
    expect(prime.experience).toBe(Math.min(99, fedor.experience + 4));
    expect(ovr(prime)).toBeGreaterThan(ovr(fedor));
  });

  it("validatePicks accepts a legal roster and rejects illegal ones", () => {
    const board = buildBoard("validate");
    const legal = board.rounds.map((r) => r.options[0].id);
    expect(validatePicks(board, legal)).toBe(true);
    expect(validatePicks(board, legal.slice(0, 9))).toBe(false);
    expect(validatePicks(board, [...legal.slice(0, 9), "not-an-option"])).toBe(false);
  });
});

// Strategies a real player might use, applied to the actual board they'd see.
const pickMaxOvr = (opts: { id: string }[]) =>
  [...opts].sort((a, b) => ovr(b as never) - ovr(a as never))[0].id;
const pickRandomIdx = (opts: { id: string }[], i: number) =>
  opts[i % opts.length].id;

/**
 * The ratings are VISIBLE in the draft (OVR, stat bars, slot matchups), so the
 * realistic ceiling is a player who reads everything: picks the card with the
 * most projected wins for that round's slot, and spends a reroll whenever the
 * best card on offer projects below `REROLL_BELOW` wins. This is the strategy
 * the 3-8% band is tuned against.
 */
const REROLL_BELOW = 2.6; // ~optimal threshold (swept 2.3-2.85)
function informedPicks(board: Board, seed: string): string[] {
  const schedule = seasonSchedule(seed);
  const exp = (f: Board["rounds"][number]["options"][number], r: number) =>
    slotWinProbs(f, schedule, r).reduce((a, b) => a + b, 0);
  let used = 0;
  return board.rounds.map((round, r) => {
    let opts = round.options;
    let best = [...opts].sort((a, b) => exp(b, r) - exp(a, r))[0];
    // A reroll replaces the whole deal — no going back to the previous cards.
    while (used < REROLLS_TOTAL && exp(best, r) < REROLL_BELOW) {
      opts = board.rerollSets[used++];
      best = [...opts].sort((a, b) => exp(b, r) - exp(a, r))[0];
    }
    return best.id;
  });
}

function playRate(strategy: "informed" | "skilled" | "random", runs: number) {
  const records: Record<string, number> = {};
  let perfect = 0;
  let oneLoss = 0;
  for (let i = 0; i < runs; i++) {
    // Board and sim share one seed — exactly like the real game (runId).
    const seed = `play-${i}`;
    const board = buildBoard(seed);
    const picks =
      strategy === "informed"
        ? informedPicks(board, seed)
        : board.rounds.map((r, ri) =>
            strategy === "skilled" ? pickMaxOvr(r.options) : pickRandomIdx(r.options, ri + i),
          );
    const res = simulateSeason({ picks, seed });
    records[res.record] = (records[res.record] ?? 0) + 1;
    if (res.losses === 0) perfect++;
    if (res.losses === 1) oneLoss++;
  }
  return { perfect: perfect / runs, oneLoss: oneLoss / runs, records };
}

describe("CALIBRATION — real play (picking from random triples)", () => {
  it("an informed player (reads OVR + slot matchups, rerolls weak rounds) is in the 3-8% band", () => {
    const { perfect, oneLoss } = playRate("informed", 4000);
    // eslint-disable-next-line no-console
    console.log(
      `\n  [real-play] informed: 30-0 ${(perfect * 100).toFixed(1)}%  |  29-1 ${(oneLoss * 100).toFixed(1)}%`,
    );
    expect(validatePicks(buildBoard("play-0"), informedPicks(buildBoard("play-0"), "play-0"))).toBe(true);
    expect(perfect).toBeGreaterThan(0.03);
    expect(perfect).toBeLessThan(0.08);
    expect(oneLoss).toBeGreaterThan(perfect); // the near-miss hook
  });

  it("a skilled player (always picks best available) is in the chase zone", () => {
    const { perfect, oneLoss } = playRate("skilled", 4000);
    // eslint-disable-next-line no-console
    console.log(
      `\n  [real-play] skilled: 30-0 ${(perfect * 100).toFixed(1)}%  |  29-1 ${(oneLoss * 100).toFixed(1)}%`,
    );
    // Agonizing-but-achievable: rare enough to chase, common enough to believe in.
    expect(perfect).toBeGreaterThan(0.01);
    expect(perfect).toBeLessThan(0.25);
    // Near-misses should be MORE common than perfection — that's the hook.
    expect(oneLoss).toBeGreaterThan(perfect);
  });

  it("a clueless player almost never goes perfect", () => {
    const { perfect } = playRate("random", 4000);
    // eslint-disable-next-line no-console
    console.log(`  [real-play] random:  30-0 ${(perfect * 100).toFixed(1)}%`);
    expect(perfect).toBeLessThan(0.04);
  });
});
