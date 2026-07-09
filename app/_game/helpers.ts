import type { Fighter, FightResult } from "@/lib/game/types";
import type { SeasonResult } from "@/lib/game/types";
import { baseId, getFighter } from "@/lib/game/fighters";
import fighterImages from "@/lib/game/fighter-images.json";

// ---- Real fighter photos (free-licensed, via Wikimedia; see scripts/) ----

const IMAGES = fighterImages as Record<string, { src: string; pageUrl: string | null }>;

export function fighterImage(id: string): string | null {
  // Exact id first (lets a mythic have its own art, e.g. Airport Porrier),
  // then the base fighter's photo (primes + mythics without custom art).
  return IMAGES[id]?.src ?? IMAGES[baseId(id)]?.src ?? null;
}

// ---- Avatars (no photos — initials + deterministic color, per product decision) ----

const AVATAR_COLORS = [
  "bg-red-600",
  "bg-orange-600",
  "bg-amber-600",
  "bg-emerald-600",
  "bg-teal-600",
  "bg-sky-600",
  "bg-indigo-600",
  "bg-fuchsia-600",
  "bg-rose-600",
  "bg-lime-600",
];

export function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ---- Scouting-report tags (soft hints in the community's language — exact
// ratings stay hidden, to reward knowledge & fuel debate without turning the
// game into a spreadsheet). One strength headline + one ⚠️ red flag when the
// fighter carries a real liability — that red flag is the near-miss warning. ----

// Elite (min ≥ 90-tier), championship, and solid tiers — nearly every fighter
// earns a real descriptor now. "🎲 Wildcard" is no longer the fallback: it's
// reserved for the true chaos merchants (see isWildcard below).
const STRENGTH_TIERS: {
  key: keyof Fighter & ("striking" | "grappling" | "cardio" | "durability" | "fightIq" | "experience" | "finishing");
  kind: string;
  tiers: [number, string][]; // [min, tag] — highest first
}[] = [
  { key: "striking", kind: "striking", tiers: [[93, "Hands of Stone"], [88, "Crisp Hands"], [83, "Sharp on the Feet"]] },
  { key: "grappling", kind: "grappling", tiers: [[92, "Human Blanket"], [86, "Strong Wrestling"], [80, "Solid Mat Game"]] },
  { key: "cardio", kind: "cardio", tiers: [[94, "Cardio for Days"], [88, "Deep Gas Tank"]] },
  { key: "durability", kind: "chin", tiers: [[90, "Granite Chin"], [86, "Tough Out"]] },
  { key: "finishing", kind: "finish", tiers: [[92, "Killer Instinct"], [86, "Finds the Finish"]] },
  { key: "fightIq", kind: "iq", tiers: [[94, "Ring General"], [88, "High Fight IQ"]] },
  { key: "experience", kind: "vet", tiers: [[94, "Been in Wars"], [88, "Grizzled Vet"]] },
];

/**
 * A true wildcard: dangerous enough to finish anyone, fragile or shallow enough
 * to lose to anyone — and no elite-tier skill to anchor the profile. Cowboy,
 * Bam Bam, Pavlovich energy: anything can happen, both ways.
 */
function isWildcard(f: Fighter): boolean {
  const chaos = f.finishing >= 84 && (f.durability <= 78 || f.cardio <= 78);
  const hasElite = STRENGTH_TIERS.some(({ key, tiers }) => f[key] >= tiers[0][0]);
  return chaos && !hasElite;
}

export function fighterTags(f: Fighter): string[] {
  const picked: string[] = [];
  const candidates = STRENGTH_TIERS.flatMap(({ key, kind, tiers }) => {
    const v = f[key];
    const hit = tiers.find(([min]) => v >= min);
    return hit ? [{ tag: hit[1], v, kind }] : [];
  });
  for (const c of candidates.sort((a, b) => b.v - a.v)) {
    picked.push(c.tag);
    if (picked.length === 2) break;
  }

  const liabilities: { tag: string; v: number; max: number }[] = [
    { tag: "⚠️ Glass Chin", v: f.durability, max: 76 },
    { tag: "⚠️ Gas Tank Questions", v: f.cardio, max: 76 },
    { tag: "⚠️ Grappling Holes", v: f.grappling, max: 68 },
    { tag: "⚠️ Green", v: f.experience, max: 72 },
  ];
  // The biggest red flag replaces the 2nd strength — strength + warning beats
  // two compliments for making the draft a real decision.
  const redFlag = liabilities.filter((l) => l.v <= l.max).sort((a, b) => a.v - b.v)[0];
  if (redFlag) {
    picked.splice(1, 1, redFlag.tag);
  }

  // Chaos merchants lead with the dice — the red flag (if any) stays visible.
  if (isWildcard(f)) {
    picked.splice(0, 1, "🎲 Wildcard");
  }

  return picked.length ? picked : ["Well-Rounded"];
}

/** True for "⚠️ …" tags so the UI can color the red flags. */
export function isLiabilityTag(tag: string): boolean {
  return tag.startsWith("⚠️");
}

// ---- Fight-log flavor — call it like the fans would (deterministic per bout,
// so the same season always reads the same). Raw method stays in the tooltip. ----

const KO_WIN = ["Put him to sleep", "Lights out", "Chin checked", "Flatlined him"];
const SUB_WIN = ["Made him tap", "Choked him out", "Deep waters", "Snatched the neck"];
const DEC_WIN = ["Cruised the cards", "Schooled him", "Left him in the mud", "Clean sweep"];
const DEC_LOSS = ["Outworked", "Edged on the cards"];
const KO_LOSS = ["Caught cold", "Got slept", "Chin cracked"];
const SUB_LOSS = ["Tapped out", "Drowned late", "Lost the scramble"];
const ROBBERY = ["Robbery 🤖", "Lost the cards", "Gassed late"];

export function methodFlavor(fight: FightResult): string {
  const variants = fight.win
    ? fight.method === "KO/TKO"
      ? KO_WIN
      : fight.method === "Submission"
        ? SUB_WIN
        : DEC_WIN
    : fight.method === "Upset KO"
      ? KO_LOSS
      : fight.method === "Upset SUB"
        ? SUB_LOSS
        : fight.method === "Upset Dec"
          ? ROBBERY
          : DEC_LOSS;
  return variants[fight.bout % variants.length];
}

// ---- Fight-night bonuses (pure derivation from the final result — the UFC
// bonus-check ritual: FOTN for the biggest sweat, PotN for the nastiest finish) ----

export function nightAwards(result: SeasonResult): {
  fotn: FightResult | null;
  potn: FightResult | null;
} {
  const wins = result.fights.filter((f) => f.win);
  // Fight of the Night: the win closest to a coin flip — the one you sweated.
  const fotn =
    [...wins].sort(
      (a, b) => Math.abs(a.winProb - 0.5) - Math.abs(b.winProb - 0.5) || a.bout - b.bout,
    )[0] ?? null;
  // Performance of the Night: a finish over the toughest opponent.
  const finishes = wins
    .filter((f) => f.method === "KO/TKO" || f.method === "Submission")
    .sort((a, b) => b.oppOvr - a.oppOvr || a.bout - b.bout);
  // Spread the checks around — if the same bout would win both, PotN goes to the next finish.
  const potn = (fotn && finishes[0]?.bout === fotn.bout ? finishes[1] : finishes[0]) ?? null;
  return { fotn, potn };
}

// ---- Share text (image card comes later; text + clipboard for MVP) ----

export function shareText(result: SeasonResult, url: string): string {
  const mvp = getFighter(result.mvpFighterId);
  const weak = getFighter(result.weakestFighterId);
  return [
    `I went ${result.record} in "Can You Go 30-0?" 🥊`,
    `${result.tier.label} · GOAT Score ${result.goatScore}`,
    `MVP: ${mvp.name}  |  Weakest: ${weak.name}`,
    ``,
    `Can you go perfect? ${url}`,
  ].join("\n");
}

// Accent color for the record by how close to perfect.
export function recordAccent(losses: number): string {
  if (losses === 0) return "text-amber-400";
  if (losses === 1) return "text-emerald-400";
  if (losses <= 3) return "text-sky-400";
  return "text-zinc-300";
}
