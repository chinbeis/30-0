import { describe, it, expect } from "vitest";
import { buildPortraitPrompt } from "./portrait";

describe("buildPortraitPrompt", () => {
  it("reflects physique (body) and elite striking on the right hand", () => {
    // [striking, wrestling, submissions, cardio, chin, fightIq, physique]
    const prompt = buildPortraitPrompt([
      "pereira", // elite striking -> giant right hand
      "khabib",
      "oliveira",
      "volkanovski",
      "holloway",
      "jones",
      "ngannou", // heavyweight physique -> hulking body
    ]);
    expect(prompt).toMatch(/heavyweight body/i);
    expect(prompt).toMatch(/right hand \(striking\)/i);
    expect(prompt).toMatch(/left hand \(submissions\)/i);
    expect(prompt.length).toBeGreaterThan(80);
  });

  it("maps chin and fight IQ to the chin and head", () => {
    const prompt = buildPortraitPrompt([
      "mcgregor",
      "guida",
      "lauzon",
      "guida",
      "tuivasa", // chin
      "guida",
      "tuivasa",
    ]);
    expect(prompt).toMatch(/chin:/i);
    expect(prompt).toMatch(/head \(fight iq\)/i);
  });
});
