import { describe, it, expect } from "vitest";
import { simulateSeason, ovr, TOTAL_BOUTS } from "./engine";
import { FIGHTERS, getFighter } from "./fighters";

const strongest10 = [...FIGHTERS]
  .sort((a, b) => ovr(b) - ovr(a))
  .slice(0, 10)
  .map((f) => f.id);

const weakest10 = [...FIGHTERS]
  .sort((a, b) => ovr(a) - ovr(b))
  .slice(0, 10)
  .map((f) => f.id);

// A realistic "good but not perfect" roster: 8 strong + 2 mediocre picks,
// the shape most players actually end up with.
const mixed10 = [...strongest10.slice(0, 8), "till", "rousey"];

function perfectRate(picks: string[], runs: number): number {
  let perfect = 0;
  for (let i = 0; i < runs; i++) {
    const r = simulateSeason({ picks, seed: `calib-${i}` });
    if (r.losses === 0) perfect++;
  }
  return perfect / runs;
}

describe("ovr", () => {
  it("is bounded and ranks elite fighters high", () => {
    const jones = ovr(getFighter("jones"));
    const till = ovr(getFighter("till"));
    expect(jones).toBeGreaterThan(90);
    expect(jones).toBeLessThanOrEqual(100);
    expect(jones).toBeGreaterThan(till);
  });
});

describe("simulateSeason", () => {
  it("is deterministic for the same picks + seed", () => {
    const a = simulateSeason({ picks: strongest10, seed: "abc" });
    const b = simulateSeason({ picks: strongest10, seed: "abc" });
    expect(a).toEqual(b);
  });

  it("changes with the seed", () => {
    const a = simulateSeason({ picks: strongest10, seed: "seed-1" });
    const b = simulateSeason({ picks: strongest10, seed: "seed-2" });
    // Overwhelmingly likely to differ across 30 fights.
    expect(a.fights).not.toEqual(b.fights);
  });

  it("always produces a record summing to 30", () => {
    for (let i = 0; i < 50; i++) {
      const r = simulateSeason({ picks: mixed10, seed: `sum-${i}` });
      expect(r.wins + r.losses).toBe(TOTAL_BOUTS);
      expect(r.record).toBe(`${r.wins}-${r.losses}`);
    }
  });

  it("rejects rosters that aren't 10 fighters", () => {
    expect(() => simulateSeason({ picks: ["jones"], seed: "x" })).toThrow();
  });

  it("identifies the weakest pick on a roster with one obvious liability", () => {
    // 9 elites + Ronda (low striking/durability/iq) -> she should usually be flagged.
    const roster = [...strongest10.slice(0, 9), "rousey"];
    let flagged = 0;
    for (let i = 0; i < 40; i++) {
      const r = simulateSeason({ picks: roster, seed: `weak-${i}` });
      if (r.weakestFighterId === "rousey") flagged++;
    }
    expect(flagged).toBeGreaterThan(20); // majority of the time
  });

  it("gives 30-0 the IMMORTAL tier and a non-empty story", () => {
    // find a perfect run for the strong roster
    let perfect = null;
    for (let i = 0; i < 200 && !perfect; i++) {
      const r = simulateSeason({ picks: strongest10, seed: `imm-${i}` });
      if (r.losses === 0) perfect = r;
    }
    expect(perfect).not.toBeNull();
    expect(perfect!.tier.label).toBe("IMMORTAL");
    expect(perfect!.story.length).toBeGreaterThan(20);
  });
});

describe("CALIBRATION — the single most important tuning (SCALE + opp curve)", () => {
  it("a strong roster hits 30-0 often enough to chase, rarely enough to hurt", () => {
    const rate = perfectRate(strongest10, 3000);
    // eslint-disable-next-line no-console
    console.log(`\n  [calibration] strong roster 30-0 rate: ${(rate * 100).toFixed(1)}%`);
    expect(rate).toBeGreaterThan(0.05); // worth chasing
    expect(rate).toBeLessThan(0.4); // not a giveaway
  });

  it("a mixed roster (2 weak picks) almost never goes perfect", () => {
    const rate = perfectRate(mixed10, 3000);
    // eslint-disable-next-line no-console
    console.log(`  [calibration] mixed roster 30-0 rate:  ${(rate * 100).toFixed(1)}%`);
    expect(rate).toBeLessThan(0.08);
  });

  it("a weak roster basically never goes perfect", () => {
    const rate = perfectRate(weakest10, 3000);
    // eslint-disable-next-line no-console
    console.log(`  [calibration] weak roster 30-0 rate:   ${(rate * 100).toFixed(1)}%`);
    expect(rate).toBeLessThan(0.02);
  });
});
