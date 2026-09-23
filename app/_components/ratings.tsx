// Shared rating visuals for both games — one color scale so a "90" reads the
// same everywhere (draft cards, team panel, sim, result, GOAT build panel).

/** Rating tier color scale (text). ≥90 elite gold · 85 green · 80 blue · 75 zinc · below red. */
export function ratingText(v: number): string {
  if (v >= 90) return "text-amber-300";
  if (v >= 85) return "text-emerald-300";
  if (v >= 80) return "text-sky-300";
  if (v >= 75) return "text-zinc-300";
  return "text-red-300";
}

/** Same scale as a bar fill. */
export function ratingFill(v: number): string {
  if (v >= 90) return "bg-gradient-to-r from-amber-500 to-amber-300";
  if (v >= 85) return "bg-emerald-400";
  if (v >= 80) return "bg-sky-400";
  if (v >= 75) return "bg-zinc-400";
  return "bg-red-400";
}

/** Win-probability color: comfortable favorite → coin flip → underdog. */
export function probText(p: number): string {
  if (p >= 0.85) return "text-emerald-300";
  if (p >= 0.7) return "text-lime-300";
  if (p >= 0.55) return "text-amber-300";
  return "text-red-300";
}

export function pct(p: number): string {
  return `${Math.round(p * 100)}%`;
}

/** Big overall number, FUT-card style. */
export function OvrBadge({
  value,
  size = "md",
  label = "OVR",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const num = size === "lg" ? "text-4xl" : size === "sm" ? "text-lg" : "text-3xl";
  return (
    <div className="flex flex-col items-center leading-none">
      <span className={`${num} font-black tabular-nums tracking-tighter ${ratingText(value)}`}>
        {Math.round(value)}
      </span>
      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </span>
    </div>
  );
}

/**
 * Compact labeled stat bar. The bar is scaled 50→100 (nobody in the pool is
 * rated below ~50), so differences between 82 and 90 are actually visible.
 */
export function StatBar({
  label,
  value,
  dim = false,
}: {
  label: string;
  value: number;
  dim?: boolean;
}) {
  const w = Math.max(4, Math.min(100, ((value - 50) / 50) * 100));
  return (
    <div className={`flex items-center gap-1.5 ${dim ? "opacity-40" : ""}`}>
      <span className="w-7 shrink-0 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full ${ratingFill(value)}`} style={{ width: `${w}%` }} />
      </div>
      <span className={`w-5 shrink-0 text-right text-[10px] font-black tabular-nums ${ratingText(value)}`}>
        {Math.round(value)}
      </span>
    </div>
  );
}
