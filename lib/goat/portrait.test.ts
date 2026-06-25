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

  it("asks for a big-head caricature with a clear, focused face", () => {
    const prompt = buildPortraitPrompt([
      "pereira", "khabib", "oliveira", "volkanovski", "holloway", "jones", "ngannou",
    ]);
    expect(prompt).toMatch(/caricature/i);
    expect(prompt).toMatch(/oversized head|big-head/i);
    expect(prompt).toMatch(/face/i); // the face must be the focus, not buried full-body
    expect(prompt).toMatch(/not a real or specific person/i); // celebrity-filter safety
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
