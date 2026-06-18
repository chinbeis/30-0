import { describe, it, expect } from "vitest";
import { buildBuildBoard, validateBuildPicks, GOAT_POOL } from "./board";
import { simulateCareer, composeFighter, CAREER_LENGTH } from "./engine";
import { attributeValue, divisionSize } from "./attributes";
import { getFighter } from "@/lib/game/fighters";
import type { Fighter } from "@/lib/game/types";

// A skilled player has only 3 rerolls for the WHOLE draft, and spends them on the
// 3 trait categories where rerolling helps most (biggest jump from the initial
// deal to the best across pages). Other rounds: best of the initial 3.
const REROLL_BUDGET = 3;
function skilledPicks(seed: string): string[] {
  const board = buildBuildBoard(seed);
  const plan = board.rounds.map((r) => {
    if (r.physique) {
      const sorted = [...r.pages[0]].sort((a, b) => divisionSize(a.division) - divisionSize(b.division));
      return { initial: sorted[1].id, upgraded: sorted[1].id, gain: -1, cat: r.category };
    }
    const byAttr = (fs: Fighter[]) =>
      [...fs].sort((a, b) => attributeValue(b, r.category) - attributeValue(a, r.category))[0];
    const p0 = byAttr(r.pages[0]);
    const all = byAttr(r.pages.flat());
    return {
      initial: p0.id,
      upgraded: all.id,
      gain: attributeValue(all, r.category) - attributeValue(p0, r.category),
      cat: r.category,
    };
  });

  // spend the 3-reroll budget on the highest-gain trait rounds
  const upgrade = new Set(
    [...plan]
      .filter((p) => p.gain > 0)
      .sort((a, b) => b.gain - a.gain)
      .slice(0, REROLL_BUDGET)
      .map((p) => p.cat),
  );
  return plan.map((p) => (upgrade.has(p.cat) ? p.upgraded : p.initial));
}

// A careless player just takes the first deal, no rerolls.
function randomPicks(seed: string, salt: number): string[] {
  const board = buildBuildBoard(seed);
  return board.rounds.map((r, i) => r.pages[0][(i + salt) % r.pages[0].length].id);
}

function rates(strategy: (seed: string, i: number) => string[], runs: number) {
  let perfect = 0;
  let triple = 0; // 12-1: lost the triple-champ fight specifically
  for (let i = 0; i < runs; i++) {
    const seed = `goat-${i}`;
    const picks = strategy(seed, i);
    const r = simulateCareer({ picks, seed: `${seed}-sim` });
    if (r.wins === 13) perfect++;
    if (r.wins === 12) triple++;
  }
  return { perfect: perfect / runs, triple: triple / runs };
}

describe("board", () => {
  it("has a wider pool than the core game", () => {
    expect(GOAT_POOL.length).toBeGreaterThan(70);
  });
  it("is deterministic and has 7 rounds with 4 pages of 3 (initial + 3 rerolls)", () => {
    const b = buildBuildBoard("x");
    expect(b).toEqual(buildBuildBoard("x"));
    expect(b.rounds).toHaveLength(7);
    b.rounds.forEach((r) => {
      expect(r.pages).toHaveLength(4); // initial + up to 3 rerolls (shared budget)
      r.pages.forEach((p) => expect(p).toHaveLength(3));
    });
  });
  it("every physique reroll page offers 3 distinct divisions", () => {
    const phys = buildBuildBoard("phys-1").rounds.find((r) => r.physique)!;
    phys.pages.forEach((page) => {
      expect(new Set(page.map((o) => o.division)).size).toBe(3);
    });
  });
  it("validateBuildPicks accepts a pick from any reroll page, rejects illegal", () => {
    const b = buildBuildBoard("v");
    const fromLastRoll = b.rounds.map((r) => r.pages[3][0].id); // 3rd reroll
    expect(validateBuildPicks(b, fromLastRoll)).toBe(true);
    expect(validateBuildPicks(b, fromLastRoll.slice(0, 6))).toBe(false);
  });
});

describe("simulateCareer", () => {
  it("is deterministic for same picks + seed", () => {
    const picks = skilledPicks("d");
    expect(simulateCareer({ picks, seed: "s" })).toEqual(simulateCareer({ picks, seed: "s" }));
  });
  it("ends at first loss; record is wins-(0|1)", () => {
    for (let i = 0; i < 50; i++) {
      const r = simulateCareer({ picks: randomPicks(`e-${i}`, i), seed: `e-${i}` });
      expect(r.losses === 0 || r.losses === 1).toBe(true);
      expect(r.record).toBe(`${r.wins}-${r.losses}`);
      if (r.losses === 1) expect(r.fights.length).toBe(r.wins + 1);
      expect(r.wins).toBeLessThanOrEqual(CAREER_LENGTH);
    }
  });
  it("rejects builds that aren't 7 picks", () => {
    expect(() => simulateCareer({ picks: ["jones"], seed: "x" })).toThrow();
  });
  it("names a deciding-loss attribute when the run ends early", () => {
    let found = null;
    for (let i = 0; i < 60 && !found; i++) {
      const r = simulateCareer({ picks: randomPicks(`l-${i}`, i), seed: `l-${i}` });
      if (r.decidingLoss) found = r;
    }
    expect(found).not.toBeNull();
    expect(found!.decidingLoss!.source.length).toBeGreaterThan(1);
  });
  it("13-0 earns THE GOAT", () => {
    let goat = null;
    for (let i = 0; i < 4000 && !goat; i++) {
      const r = simulateCareer({ picks: skilledPicks(`g-${i}`), seed: `g-${i}-sim` });
      if (r.wins === 13) goat = r;
    }
    expect(goat).not.toBeNull();
    expect(goat!.tier.label).toBe("THE GOAT");
  });
});

describe("CALIBRATION — tough by design", () => {
  it("a skilled build reaches 13-0 rarely; near-miss is more common", () => {
    const { perfect, triple } = rates((s) => skilledPicks(s), 5000);
    // eslint-disable-next-line no-console
    console.log(
      `\n  [goat] skilled: 13-0 ${(perfect * 100).toFixed(1)}%  |  12-1 (lost triple fight) ${(triple * 100).toFixed(1)}%`,
    );
    expect(perfect).toBeGreaterThan(0.01); // worth chasing
    expect(perfect).toBeLessThan(0.1); // tough
    expect(triple).toBeGreaterThan(perfect); // heartbreak > glory
  });
  it("a careless build almost never becomes the GOAT", () => {
    const { perfect } = rates((s, i) => randomPicks(s, i), 5000);
    // eslint-disable-next-line no-console
    console.log(`  [goat] random:  13-0 ${(perfect * 100).toFixed(1)}%`);
    expect(perfect).toBeLessThan(0.02);
  });
});

describe("composeFighter", () => {
  it("inherits each trait from the chosen fighter and physique sets the division", () => {
    // [striking, wrestling, submissions, cardio, chin, fightIq, physique]
    const a = composeFighter(["pereira", "khabib", "oliveira", "volkanovski", "holloway", "jones", "ngannou"]);
    expect(a.sources.striking).toBe("pereira");
    expect(a.sources.wrestling).toBe("khabib");
    expect(a.striking).toBe(getFighter("pereira").striking); // 96
    expect(a.wrestling).toBe(getFighter("khabib").grappling); // 99
    expect(a.division).toBe("Heavyweight"); // ngannou physique
    expect(a.size).toBe(7);
  });
});
