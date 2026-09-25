"use client";

import { useSyncExternalStore } from "react";
import { recordAccent } from "../_game/helpers";

// Reads a game's personal best straight from localStorage. The server snapshot
// is null, so nothing renders until hydration — no mismatch, no flash of "0-0".
const noop = () => () => {};

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function PersonalBest({ storageKey, label }: { storageKey: string; label: string }) {
  const raw = useSyncExternalStore(noop, () => read(storageKey), () => null);
  if (!raw) return null;

  let record: string | undefined;
  let losses = 1;
  try {
    const best = JSON.parse(raw) as { record?: string; losses?: number; wins?: number };
    record = best.record;
    losses = best.losses ?? Number(record?.split("-")[1] ?? 1);
  } catch {
    return null;
  }
  if (!record) return null;

  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-sm bg-black/70 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 ring-1 ring-white/10">
      {label}
      <span className={`font-mono text-xs tabular-nums ${recordAccent(losses)}`}>{record}</span>
    </span>
  );
}
