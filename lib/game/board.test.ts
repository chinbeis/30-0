import { describe, it, expect } from "vitest";
import { buildBoard, validatePicks, CHOICES_PER_ROUND } from "./board";
import { simulateSeason, ovr, ROSTER_SIZE } from "./engine";

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

function playRate(strategy: "skilled" | "random", runs: number) {
  const records: Record<string, number> = {};
  let perfect = 0;
  let oneLoss = 0;
  for (let i = 0; i < runs; i++) {
    const board = buildBoard(`play-${i}`);
    const picks = board.rounds.map((r, ri) =>
      strategy === "skilled" ? pickMaxOvr(r.options) : pickRandomIdx(r.options, ri + i),
    );
    const res = simulateSeason({ picks, seed: `play-sim-${i}` });
    records[res.record] = (records[res.record] ?? 0) + 1;
    if (res.losses === 0) perfect++;
    if (res.losses === 1) oneLoss++;
  }
  return { perfect: perfect / runs, oneLoss: oneLoss / runs, records };
}

describe("CALIBRATION — real play (picking from random triples)", () => {
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
