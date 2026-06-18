import type { Division } from "@/lib/game/types";
import { attributeValue } from "./attributes";
import { getPoolFighter } from "./engine";

// Builds a comedic image prompt from the 7 build picks. We describe the fighter's
// exaggerated ATTRIBUTES (not real faces) — funnier, and it passes image-API
// celebrity filters. picks are aligned to CATEGORIES order:
// [striking, wrestling, submissions, cardio, chin, fightIq, physique]

function bodyFor(division: Division): string {
  switch (division) {
    case "Heavyweight":
      return "an enormous hulking barrel-chested heavyweight body";
    case "Light Heavyweight":
      return "a towering, powerfully muscled light-heavyweight build";
    case "Middleweight":
      return "a thick, broad athletic middleweight frame";
    case "Welterweight":
      return "a chiseled, V-shaped welterweight build";
    case "Lightweight":
      return "a lean, compact lightweight frame";
    case "Featherweight":
      return "a small, wiry featherweight body";
    default:
      return "a tiny, pint-sized flyweight body";
  }
}

export function buildPortraitPrompt(picks: string[]): string {
  const [strikingId, wrestlingId, subsId, cardioId, chinId, iqId, physiqueId] = picks;
  const f = getPoolFighter;

  const striking = attributeValue(f(strikingId), "striking");
  const wrestling = attributeValue(f(wrestlingId), "wrestling");
  const subs = attributeValue(f(subsId), "submissions");
  const cardio = attributeValue(f(cardioId), "cardio");
  const chin = attributeValue(f(chinId), "chin");
  const iq = attributeValue(f(iqId), "fightIq");
  const division = f(physiqueId).division;

  const parts: string[] = [bodyFor(division)];

  parts.push(
    striking >= 90
      ? "comically gigantic glowing boxing fists crackling with knockout power"
      : striking < 74
        ? "puny little noodle arms"
        : "big confident fists",
  );
  parts.push(
    wrestling >= 88
      ? "enormous tree-trunk legs and a thick bull neck for slamming people"
      : wrestling < 74
        ? "skinny wobbly legs"
        : "sturdy wrestler's legs",
  );
  if (subs >= 88) parts.push("long gangly octopus arms tangled in a submission");
  parts.push(
    cardio >= 90
      ? "huge over-inflated lungs and a fresh energetic grin"
      : cardio < 72
        ? "tongue hanging out, utterly gassed and drenched in sweat"
        : "a steady determined breath",
  );
  parts.push(
    chin >= 90
      ? "a massive granite boulder jaw"
      : chin < 74
        ? "a fragile cracked glass jaw"
        : "a solid square jaw",
  );
  parts.push(
    iq >= 90
      ? "a smug genius expression wearing tiny spectacles"
      : iq < 74
        ? "a confused, dazed look"
        : "sharp focused eyes",
  );

  return (
    `A funny exaggerated cartoon caricature of a single mixed martial arts fighter ` +
    `standing in a cage. The fighter has ${parts.join(", ")}. ` +
    `Vibrant comic-book style, bold outlines, humorous and over-the-top, full body, centered, no text, no logos.`
  );
}
