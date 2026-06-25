import type { Division } from "@/lib/game/types";
import { attributeValue } from "./attributes";
import { getPoolFighter } from "./engine";

// Builds a comedic image prompt from the 7 build picks. We describe the fighter's
// exaggerated ATTRIBUTES (not real faces) — funnier, and it passes image-API
// celebrity filters. picks are aligned to CATEGORIES order:
// [striking, wrestling, submissions, cardio, chin, fightIq, physique]
//
// Format: a BIG-HEAD CARICATURE / bobblehead. The oversized head makes the face
// large, sharp and expressive (clear face), while the tiny exaggerated body keeps
// it funny — the "funny caricature online" look.

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
// right thing: striking = RIGHT hand, submissions = LEFT hand, chin = jaw,
// fight IQ = head/eyes, wrestling = legs, cardio = facial energy, physique = body.
function rightHandFor(striking: number): string {
  return striking >= 90
    ? "a comically gigantic glowing right fist crackling with knockout power"
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
    ? "an enormous granite boulder jaw jutting way out"
    : chin < 74
      ? "a tiny, fragile cracked-glass chin"
      : "a solid, square heroic jaw";
}
// fight IQ -> the head/eyes/brow — the most expressive part of the face
function headFor(iq: number): string {
  return iq >= 90
    ? "a huge brainy bald-domed head, big clever sparkling eyes, raised eyebrow, smug knowing smirk and tiny round spectacles"
    : iq < 74
      ? "a small dazed head with wide cross-eyed confusion and a goofy open-mouthed expression"
      : "a sharp, focused head with confident narrowed eyes and a determined brow";
}
function legsFor(wrestling: number): string {
  return wrestling >= 88
    ? "enormous tree-trunk legs and a thick bull neck for slamming people"
    : wrestling < 74
      ? "skinny wobbly toothpick legs"
      : "sturdy, planted wrestler's legs";
}
// cardio -> facial energy / mouth expression
function energyFor(cardio: number): string {
  return cardio >= 90
    ? "a fresh, beaming, ear-to-ear energetic grin with lively wide eyes"
    : cardio < 72
      ? "tongue lolling out, cheeks puffed, eyes drooping, utterly gassed and dripping with cartoon sweat"
      : "a steady, determined look, breathing hard but composed";
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
    // ---- STYLE: big-head caricature, the look that reads as "funny online" ----
    `A hilarious big-head caricature of an original mixed-martial-arts fighter, ` +
    `glossy 3D Pixar/DreamWorks-style comedic render. ` +
    `Exaggerated bobblehead proportions: a massively OVERSIZED head with a crisp, ` +
    `detailed, highly expressive cartoon face sitting on a small, over-the-top body, ` +
    `posed inside a UFC-style octagon cage. ` +
    // ---- THE FACE is the hero: it must be large, sharp and readable ----
    `Make the FACE the clear focus — sharp, well-lit and instantly readable, ` +
    `with bold exaggerated facial features and a big comedic expression. ` +
    `Head (fight IQ): ${headFor(iq)}. ` +
    `Chin: ${chinDescFor(chin)}. ` +
    `Facial energy (cardio): ${energyFor(cardio)}. ` +
    // ---- THE BODY: the funny exaggerations, kept smaller than the head ----
    `Body: ${bodyFor(division)}. ` +
    `Right hand (striking): ${rightHandFor(striking)}. ` +
    `Left hand (submissions): ${leftHandFor(subs)}. ` +
    `Legs (wrestling): ${legsFor(wrestling)}. ` +
    // ---- COMPOSITION + SAFETY ----
    `Three-quarter view, head and shoulders prominent so the face fills much of the frame, ` +
    `centered single character, bright studio lighting, vibrant saturated colors, ` +
    `clean softly-blurred background, sharp focus on the face. ` +
    `Original cartoon character, NOT a real or specific person, no text, no words, ` +
    `no logos, no watermark.`
  );
}
