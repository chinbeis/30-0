import type { Fighter } from "@/lib/game/types";
import type { SeasonResult } from "@/lib/game/types";
import { getFighter } from "@/lib/game/fighters";
import fighterImages from "@/lib/game/fighter-images.json";

// ---- Real fighter photos (free-licensed, via Wikimedia; see scripts/) ----

const IMAGES = fighterImages as Record<string, { src: string; pageUrl: string | null }>;

export function fighterImage(id: string): string | null {
  return IMAGES[id]?.src ?? null;
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

// ---- Qualitative tags (soft hints — exact ratings stay hidden, to reward
// knowledge & fuel debate without turning the game into a spreadsheet) ----

export function fighterTags(f: Fighter): string[] {
  const candidates: { tag: string; v: number; min: number }[] = [
    { tag: "Elite Striker", v: f.striking, min: 93 },
    { tag: "Sharp Striker", v: f.striking, min: 88 },
    { tag: "Elite Grappler", v: f.grappling, min: 92 },
    { tag: "Wrestler", v: f.grappling, min: 86 },
    { tag: "Cardio Machine", v: f.cardio, min: 94 },
    { tag: "Iron Chin", v: f.durability, min: 90 },
    { tag: "Finisher", v: f.finishing, min: 92 },
    { tag: "Ring General", v: f.fightIq, min: 94 },
    { tag: "Grizzled Vet", v: f.experience, min: 94 },
  ];
  const picked: string[] = [];
  const seenKind = new Set<string>();
  for (const c of candidates.sort((a, b) => b.v - a.v)) {
    if (c.v < c.min) continue;
    // avoid showing both "Elite Striker" and "Sharp Striker"
    const kind = c.tag.split(" ").pop()!;
    if (seenKind.has(kind)) continue;
    seenKind.add(kind);
    picked.push(c.tag);
    if (picked.length === 2) break;
  }
  return picked.length ? picked : ["Wildcard"];
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
