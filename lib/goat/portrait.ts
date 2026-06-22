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

// Each trait maps to a specific body part so the image model exaggerates the
// right thing: striking = RIGHT hand, submissions = LEFT hand, chin = chin,
// fight IQ = head, wrestling = legs, cardio = lungs/energy, physique = body.
function rightHandFor(striking: number): string {
  return striking >= 90
    ? "a comically gigantic glowing right hand/fist crackling with knockout power"
    : striking < 74
      ? "a puny little noodle right arm"
      : "a big confident right fist";
}
function leftHandFor(subs: number): string {
  return subs >= 88
    ? "a long gangly octopus-like left arm tangled in a submission grip"
    : subs < 74
      ? "a clumsy, harmless left arm"
      : "a sneaky grappling left arm ready to submit";
}
function chinDescFor(chin: number): string {
  return chin >= 90
    ? "a massive granite boulder chin"
    : chin < 74
      ? "a fragile cracked-glass chin"
      : "a solid square chin";
}
function headFor(iq: number): string {
  return iq >= 90
    ? "an oversized genius head with a smug expression and tiny spectacles"
    : iq < 74
      ? "a small confused, dazed head"
      : "a sharp, focused head";
}
function legsFor(wrestling: number): string {
  return wrestling >= 88
    ? "enormous tree-trunk legs and a thick bull neck for slamming people"
    : wrestling < 74
      ? "skinny wobbly legs"
      : "sturdy wrestler's legs";
}
function energyFor(cardio: number): string {
  return cardio >= 90
    ? "huge over-inflated lungs and a fresh energetic grin"
    : cardio < 72
      ? "tongue hanging out, utterly gassed and drenched in sweat"
      : "a steady determined breath";
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

  return (
    `Make a comedic, cartoonish UFC mixed martial arts fighter — a single character ` +
    `that combines these exaggerated traits, standing in an octagon cage. ` +
    `Body: ${bodyFor(division)}. ` +
    `Right hand (striking): ${rightHandFor(striking)}. ` +
    `Left hand (submissions): ${leftHandFor(subs)}. ` +
    `Chin: ${chinDescFor(chin)}. ` +
    `Head (fight IQ): ${headFor(iq)}. ` +
    `Legs (wrestling): ${legsFor(wrestling)}. ` +
    `Energy (cardio): ${energyFor(cardio)}. ` +
    `Vibrant comic-book style, bold outlines, humorous and over-the-top, full body, ` +
    `centered, no text, no logos, not a real person.`
  );
}
