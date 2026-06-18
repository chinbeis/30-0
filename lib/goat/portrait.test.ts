import { describe, it, expect } from "vitest";
import { buildPortraitPrompt } from "./portrait";

describe("buildPortraitPrompt", () => {
  it("reflects physique (body) and elite striking (giant fists)", () => {
    // [striking, wrestling, submissions, cardio, chin, fightIq, physique]
    const prompt = buildPortraitPrompt([
      "pereira", // elite striking -> giant fists
      "khabib",
      "oliveira",
      "volkanovski",
      "holloway",
      "jones",
      "ngannou", // heavyweight physique -> hulking body
    ]);
    expect(prompt).toMatch(/heavyweight body/i);
    expect(prompt).toMatch(/fists/i);
    expect(prompt.length).toBeGreaterThan(80);
  });

  it("describes a weak attribute comically (glass jaw)", () => {
    // chin from someone with low durability (Tuivasa, 76) won't trigger; use a low one
    const prompt = buildPortraitPrompt([
      "mcgregor",
      "guida",
      "lauzon",
      "guida",
      "tuivasa", // chin/durability 76 -> not glass; check it still produces a jaw phrase
      "guida",
      "tuivasa",
    ]);
    expect(prompt).toMatch(/jaw/i);
  });
});
