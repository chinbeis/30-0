"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildBuildBoard,
  REROLLS_TOTAL,
  type BuildBoard,
  type BuildRound,
} from "@/lib/goat/board";
import {
  ATTR_LABEL,
  CAREER_LADDER,
  composePartial,
  getPoolFighter,
  projectCareer,
  resemblance,
  simulateCareer,
} from "@/lib/goat/engine";
import { attributeValue, CATEGORIES, divisionSize, traitTag } from "@/lib/goat/attributes";
import type { BuildAttributes, CareerResult, CategoryKey, TraitKey } from "@/lib/goat/types";
import type { Fighter } from "@/lib/game/types";
import { FighterAvatar } from "@/app/_game/FighterAvatar";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ShareModal } from "@/app/_components/ShareModal";
import { OvrBadge, StatBar, pct, probText } from "@/app/_components/ratings";
import { sfx, useDealSound, useOutcomeSound } from "@/app/_components/sfx";

type Phase = "start" | "pick" | "sim" | "result";

export type SessionUser = { name: string | null; image: string | null } | null;
export type GoatChallengeInfo = {
  id: string;
  seed: string;
  creatorName: string;
  creatorWins: number;
  creatorLosses: number;
  creatorGoat: number;
};

const ROUNDS = 7;
const BEST_KEY = "goat:best";
const NICK_KEY = "goat:nick";
const GUEST_KEY = "goat:guestId";
type Best = { wins: number; record: string; goatScore: number; tier: string };

function ensureGuestId(): string {
  try {
    let g = localStorage.getItem(GUEST_KEY);
    if (!g) {
      g = crypto.randomUUID();
      localStorage.setItem(GUEST_KEY, g);
    }
    return g;
  } catch {
    return "anon";
  }
}

const TRAIT_KEYS: TraitKey[] = [
  "striking",
  "wrestling",
  "submissions",
  "cardio",
  "chin",
  "fightIq",
];

function readBest(): Best | null {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    return raw ? (JSON.parse(raw) as Best) : null;
  } catch {
    return null;
  }
}
function saveIfBest(r: CareerResult): void {
  try {
    const cur = readBest();
    const better = !cur || r.wins > cur.wins || (r.wins === cur.wins && r.goatScore > cur.goatScore);
    if (better)
      localStorage.setItem(
        BEST_KEY,
        JSON.stringify({ wins: r.wins, record: r.record, goatScore: r.goatScore, tier: r.tier.label }),
      );
  } catch {
    /* ignore */
  }
}
function newRunId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function tierAccent(label: string): string {
  if (label === "THE GOAT") return "text-amber-400";
  if (label === "DOUBLE CHAMPION") return "text-emerald-400";
  if (label === "CHAMPION") return "text-sky-400";
  return "text-zinc-300";
}
function recordAccent(losses: number, wins: number): string {
  if (losses === 0) return "text-amber-400";
  if (wins >= 12) return "text-emerald-400";
  if (wins >= 10) return "text-sky-400";
  return "text-zinc-300";
}

export default function Build({
  portraitEnabled = false,
  user,
  challenge,
}: {
  portraitEnabled?: boolean;
  user?: SessionUser;
  challenge?: GoatChallengeInfo;
}) {
  const [phase, setPhase] = useState<Phase>(challenge ? "pick" : "start");
  const [runId, setRunId] = useState(challenge ? challenge.seed : "");
  const [board, setBoard] = useState<BuildBoard | null>(() =>
    challenge ? buildBuildBoard(challenge.seed) : null,
  );
  const [round, setRound] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const [rerollsLeft, setRerollsLeft] = useState(REROLLS_TOTAL);
  const [result, setResult] = useState<CareerResult | null>(null);

  const start = useCallback(() => {
    const id = challenge ? challenge.seed : newRunId();
    setRunId(id);
    setBoard(buildBuildBoard(id));
    setRound(0);
    setPicks([]);
    setRerollsLeft(REROLLS_TOTAL);
    setResult(null);
    setPhase("pick");
  }, [challenge]);

  const pick = useCallback(
    (fighterId: string) => {
      sfx.pick();
      const next = [...picks, fighterId];
      setPicks(next);
      if (next.length === ROUNDS) {
        const r = simulateCareer({ picks: next, seed: runId });
        setResult(r);
        saveIfBest(r);
        setPhase("sim");
      } else {
        setRound((x) => x + 1);
      }
    },
    [picks, runId],
  );

  // Skip the description screen: start building immediately on entry (random
  // seed generated client-side in an effect to avoid an SSR/hydration mismatch).
  const startedRef = useRef(false);
  useEffect(() => {
    if (challenge || startedRef.current) return;
    startedRef.current = true;
    start();
  }, [challenge, start]);

  if (phase === "start") return <Loading />;
  if (phase === "sim" && result)
    return <SimScreen result={result} onDone={() => setPhase("result")} />;
  if (phase === "result" && result)
    return (
      <ResultScreen
        result={result}
        seed={runId}
        picks={picks}
        user={user ?? null}
        challenge={challenge}
        portraitEnabled={portraitEnabled}
        onReplay={start}
      />
    );
  if (phase === "pick" && board)
    return (
      <PickScreen
        key={round}
        round={board.rounds[round]}
        roundIndex={round}
        picks={picks}
        rerollsLeft={rerollsLeft}
        onReroll={() => setRerollsLeft((n) => n - 1)}
        onPick={pick}
      />
    );
  return null;
}

// ---------------------------------------------------------------------------

function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-800 border-t-amber-400" />
    </div>
  );
}

// ---------------------------------------------------------------------------

const TAG_COLOR: Record<string, string> = {
  // combat-trait tiers (MMA-flavored)
  Generational: "bg-amber-500/20 text-amber-300",
  Elite: "bg-emerald-500/20 text-emerald-300",
  Championship: "bg-teal-500/20 text-teal-300",
  Dangerous: "bg-sky-500/20 text-sky-300",
  Solid: "bg-indigo-500/20 text-indigo-300",
  Serviceable: "bg-zinc-700 text-zinc-300",
  Exposed: "bg-red-500/20 text-red-300",
  // physique tiers
  "Physical Freak": "bg-amber-500/20 text-amber-300",
  "Division Bully": "bg-emerald-500/20 text-emerald-300",
  "Well-Built": "bg-teal-500/20 text-teal-300",
  "Solid Frame": "bg-sky-500/20 text-sky-300",
  Undersized: "bg-zinc-700 text-zinc-300",
  Outmuscled: "bg-red-500/20 text-red-300",
};

/** Short stat labels — same 3-letter style as the 30-0 cards. */
const SHORT: Record<CategoryKey, string> = {
  striking: "STR",
  wrestling: "WRS",
  submissions: "SUB",
  cardio: "CRD",
  chin: "CHN",
  fightIq: "IQ",
  physique: "PHY",
};

/** Category keys in draft order (picks[i] fills ORDER[i]). */
const ORDER: CategoryKey[] = CATEGORIES.map((c) => c.key);

type FrameKind = "big" | "mid" | "small";
function frameKind(f: Fighter): FrameKind {
  const size = divisionSize(f.division);
  return size >= 6 ? "big" : size <= 2 ? "small" : "mid";
}

function PickScreen({
  round,
  roundIndex,
  picks,
  rerollsLeft,
  onReroll,
  onPick,
}: {
  round: BuildRound;
  roundIndex: number;
  picks: string[];
  rerollsLeft: number;
  onReroll: () => void;
  onPick: (id: string) => void;
}) {
  const { t } = useI18n();
  const [rollIndex, setRollIndex] = useState(0);
  const [rolling, setRolling] = useState(false);
  // Hovering/focusing a card previews how the build's odds would move with it.
  const [previewId, setPreviewId] = useState<string | null>(null);
  const options = round.pages[rollIndex];
  // gated by the shared draft-wide budget AND how many pages this round has
  const canRoll = rerollsLeft > 0 && rollIndex < round.pages.length - 1 && !rolling;
  useDealSound(
    options.length,
    options.some((f) => f.isPrime),
    options.some((f) => f.isMythic),
    rollIndex,
  );

  const onRoll = () => {
    if (!canRoll) return;
    sfx.reroll();
    setRolling(true);
    setPreviewId(null);
    setTimeout(() => {
      setRollIndex((i) => i + 1);
      onReroll();
      setRolling(false);
    }, 300);
  };

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-6">
      <div className="flex flex-col">
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
          <span>
            {t.goat.round} <span className="text-amber-400">{roundIndex + 1}</span> / {ROUNDS}
          </span>
          <span className="tabular-nums">
            {picks.length} {t.goat.traitsChosen}
          </span>
        </div>
        <div className="mb-6 flex gap-1">
          {ORDER.map((k, i) => (
            <div
              key={k}
              className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                i < roundIndex
                  ? "bg-fight"
                  : i === roundIndex
                    ? "animate-now bg-fight/60"
                    : "bg-zinc-800"
              }`}
              title={ATTR_LABEL[k]}
            />
          ))}
        </div>

        <p className="text-center text-[11px] font-bold uppercase tracking-[0.3em] text-amber-500">
          {SHORT[round.category]} · {round.blurb}
        </p>
        <h2 className="mt-1 text-center text-3xl font-black tracking-tight sm:text-4xl">{round.label}</h2>
        <p className="mb-5 mt-1 text-center text-sm text-zinc-500">
          {round.physique
            ? t.goat.chooseFrame
            : t.goat.whose.replace("{trait}", round.label.toLowerCase())}
        </p>

        {/* keyed by rollIndex so the cards replay their deal animation on every reroll */}
        <div key={rollIndex} className="grid content-start gap-3 sm:grid-cols-3">
          {options.map((f, i) => (
            <TraitCard
              key={f.id}
              fighter={f}
              category={round.category}
              physique={round.physique}
              index={i}
              disabled={rolling}
              onPreview={(on) => {
                if (on) sfx.hover();
                setPreviewId(on ? f.id : null);
              }}
              onClick={() => !rolling && onPick(f.id)}
            />
          ))}
        </div>

        {/* reroll control — shared budget across the whole draft */}
        <div className="mt-5 flex flex-col items-center gap-1.5">
          <button
            onClick={onRoll}
            disabled={!canRoll}
            className="flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-500/10 px-6 py-2.5 text-sm font-bold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className={rolling ? "animate-roll inline-block" : "inline-block"}>🎲</span>
            {rerollsLeft > 0 ? `${t.goat.reroll}  ·  ${rerollsLeft} ${t.goat.left}` : t.goat.noRerolls}
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: REROLLS_TOTAL }).map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${i < rerollsLeft ? "bg-amber-400" : "bg-zinc-700"}`}
              />
            ))}
            <span className="ml-1 text-[10px] uppercase tracking-wide text-zinc-600">
              {t.goat.rerollsLeft}
            </span>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-zinc-600">{t.goat.stakes}</p>
      </div>

      <BuildPanel picks={picks} roundIndex={roundIndex} previewId={previewId} />
    </div>
  );
}

function TraitCard({
  fighter,
  category,
  physique,
  index,
  disabled,
  onPreview,
  onClick,
}: {
  fighter: Fighter;
  category: CategoryKey;
  physique: boolean;
  index: number;
  disabled: boolean;
  onPreview: (on: boolean) => void;
  onClick: () => void;
}) {
  const { t } = useI18n();
  const tag = traitTag(fighter, category);
  const value = attributeValue(fighter, category);
  const mythic = !!fighter.isMythic;
  const frame = physique ? frameKind(fighter) : null;
  const frameNote =
    frame === "big" ? t.goat.frameBig : frame === "small" ? t.goat.frameSmall : t.goat.frameMid;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onPreview(true)}
      onMouseLeave={() => onPreview(false)}
      onFocus={() => onPreview(true)}
      onBlur={() => onPreview(false)}
      disabled={disabled}
      style={{ animationDelay: `${index * 70}ms` }}
      className={`animate-deal card-sheen group relative flex items-center gap-4 rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none sm:flex-col sm:items-stretch sm:p-5 sm:text-center ${
        mythic
          ? "animate-mythic border-fuchsia-400/70 bg-gradient-to-b from-fuchsia-500/15 via-purple-500/10 to-zinc-900/80 hover:border-fuchsia-300 hover:shadow-xl hover:shadow-fuchsia-500/30"
          : "border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 hover:border-amber-500/60 hover:shadow-xl hover:shadow-amber-500/10"
      }`}
    >
      {/* desktop: rating + chip strip across the top of the card */}
      <div className="hidden items-start justify-between sm:flex">
        <OvrBadge value={value} label={SHORT[category]} />
        {mythic ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-fuchsia-300 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-black shadow-md shadow-fuchsia-500/40">
            🔮 Mythical
          </span>
        ) : (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TAG_COLOR[tag] ?? "bg-zinc-700 text-zinc-300"}`}
          >
            {tag}
          </span>
        )}
      </div>

      {/* uniform framed thumbnail — same square crop on every photo (mixed sizes + monogram fallbacks) */}
      <FighterAvatar
        id={fighter.id}
        name={fighter.name}
        className={`h-[4.5rem] w-[4.5rem] shrink-0 rounded-2xl ring-2 transition sm:mx-auto sm:h-32 sm:w-32 ${
          mythic ? "ring-fuchsia-400/80 group-hover:ring-fuchsia-300" : "ring-zinc-700 group-hover:ring-amber-500/60"
        }`}
        imgClassName="transition duration-500 ease-out group-hover:scale-105"
        textClass="text-2xl"
        sizes="(min-width: 640px) 128px, 72px"
      />

      <div className="min-w-0 flex-1">
        {mythic ? (
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-fuchsia-300 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-black shadow-md shadow-fuchsia-500/40 sm:hidden">
            🔮 Mythical
          </span>
        ) : null}
        <div className="truncate text-base font-black leading-tight sm:text-lg">{fighter.name}</div>
        {fighter.nickname ? (
          <div className="truncate text-xs italic text-zinc-500">&ldquo;{fighter.nickname}&rdquo;</div>
        ) : null}
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {fighter.division} · {fighter.era}
        </div>
        {/* mobile: tag inline (desktop shows it in the top strip) */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1 sm:hidden">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TAG_COLOR[tag] ?? "bg-zinc-700 text-zinc-300"}`}
          >
            {tag}
          </span>
        </div>
        {frame ? (
          <p className="mt-2 text-[11px] leading-snug text-zinc-400">
            <span aria-hidden>{frame === "big" ? "🦍 " : frame === "small" ? "🐆 " : "⚖️ "}</span>
            {frameNote}
          </p>
        ) : null}
        <div className="mt-2.5 hidden sm:block">
          <StatBar label={SHORT[category]} value={value} />
        </div>
      </div>

      {/* mobile: rating on the right edge */}
      <div className="shrink-0 sm:hidden">
        <OvrBadge value={value} size="sm" label={SHORT[category]} />
      </div>
    </button>
  );
}

/** Signed percentage-point delta chip for the hover preview. */
function Delta({ from, to }: { from: number; to: number }) {
  const d = Math.round((to - from) * 100);
  if (d === 0) return null;
  return (
    <span className={`ml-1 text-[10px] font-black ${d > 0 ? "text-emerald-400" : "text-red-400"}`}>
      {d > 0 ? "+" : ""}
      {d}
    </span>
  );
}

/**
 * Live "Your fighter" panel: every drafted trait with its source fighter, the
 * projected belt / GOAT odds (same math as the sim, style-averaged), active
 * synergies, and the 13-rung ladder with per-fight win %. Hovering a card
 * previews the odds WITH that pick.
 */
function BuildPanel({
  picks,
  roundIndex,
  previewId,
}: {
  picks: string[];
  roundIndex: number;
  previewId: string | null;
}) {
  const { t } = useI18n();
  const [showLadder, setShowLadder] = useState(false);
  const base = useMemo(() => projectCareer(composePartial(picks)), [picks]);
  const previewPicks = useMemo(() => {
    if (!previewId) return null;
    const next = [...picks];
    next[roundIndex] = previewId;
    return next;
  }, [picks, previewId, roundIndex]);
  const preview = useMemo(
    () => (previewPicks ? projectCareer(composePartial(previewPicks)) : null),
    [previewPicks],
  );
  const shown = preview ?? base;
  const shownPicks = previewPicks ?? picks;
  // "Goofy Goober" (nothing above 84) would fire on the placeholder values of
  // undrafted traits — only show it once all six skills are real picks.
  const synergies = shown.synergies.filter(
    (s) => s !== "Goofy Goober" || shownPicks.filter(Boolean).length >= 6,
  );
  const attrs = composePartial(shownPicks);
  const complete = picks.length >= ROUNDS;

  return (
    <aside className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 lg:sticky lg:top-20 lg:mt-0">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-300">{t.goat.yourBuild}</h3>
        {shownPicks[6] ? (
          <span className="truncate pl-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            {attrs.division}
          </span>
        ) : null}
      </div>

      <div className="mt-3 space-y-1.5">
        {ORDER.map((k, i) => {
          const id = shownPicks[i];
          const isPreview = !!previewPicks && i === roundIndex;
          const current = i === roundIndex;
          return (
            <div
              key={k}
              className={`flex items-center gap-2 rounded-lg px-1.5 py-1 ${
                current ? "bg-amber-500/10 ring-1 ring-amber-500/40" : ""
              }`}
            >
              {id ? (
                <FighterAvatar
                  id={id}
                  name={getPoolFighter(id).name}
                  className={`h-6 w-6 shrink-0 rounded-full ring-1 ${isPreview ? "ring-amber-400" : "ring-zinc-700"}`}
                  textClass="text-[8px]"
                  sizes="24px"
                />
              ) : (
                <span className="h-6 w-6 shrink-0 rounded-full border border-dashed border-zinc-700" />
              )}
              <div className="min-w-0 flex-1">
                {id ? (
                  <StatBar label={SHORT[k]} value={attrs[k]} />
                ) : (
                  <div className="flex items-center gap-1.5 opacity-40">
                    <span className="w-7 shrink-0 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                      {SHORT[k]}
                    </span>
                    <div className="h-1.5 flex-1 rounded-full border border-dashed border-zinc-700" />
                    <span className="w-5 shrink-0 text-right text-[10px] font-black text-zinc-600">—</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-zinc-800 bg-black/40 p-2.5 text-center">
          <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{t.goat.beltOdds}</div>
          <div className={`text-2xl font-black tabular-nums ${probText(shown.beltOdds)}`}>
            {pct(shown.beltOdds)}
            {preview ? <Delta from={base.beltOdds} to={preview.beltOdds} /> : null}
          </div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5 text-center">
          <div className="text-[9px] font-bold uppercase tracking-widest text-amber-400">{t.goat.goatOdds}</div>
          <div className="text-2xl font-black tabular-nums text-amber-300">
            {oddsLabel(shown.goatOdds)}
            {preview ? <Delta from={base.goatOdds} to={preview.goatOdds} /> : null}
          </div>
        </div>
      </div>
      {!complete ? <p className="mt-1.5 text-center text-[10px] text-zinc-600">{t.goat.estimate}</p> : null}

      {synergies.length ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {synergies.map((s) => (
            <span key={s} className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              ⚡ {s}
            </span>
          ))}
        </div>
      ) : null}

      <button
        onClick={() => setShowLadder((v) => !v)}
        className="mt-4 w-full text-center text-[11px] font-semibold uppercase tracking-widest text-zinc-500 transition hover:text-zinc-300 lg:hidden"
      >
        {showLadder ? t.goat.hideLadder : t.goat.showLadder} {showLadder ? "▴" : "▾"}
      </button>
      <div className={`${showLadder ? "" : "hidden"} mt-3 lg:block`}>
        <div className="mb-1.5 hidden text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 lg:block">
          {t.goat.gauntlet}
        </div>
        <ol className="space-y-0.5">
          {CAREER_LADDER.map((node, i) => (
            <li key={i} className="flex items-center gap-2 text-[11px]">
              <span className="w-4 shrink-0 text-right tabular-nums text-zinc-600">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-zinc-400">
                {node.label}
                {node.kind === "title" ? " 🏆" : node.kind === "moveup" ? " ▲" : ""}
              </span>
              <span className={`shrink-0 font-bold tabular-nums ${probText(shown.rungs[i])}`}>
                {pct(shown.rungs[i])}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}

/** GOAT odds are often tiny — show "<1%" rather than a misleading "0%". */
function oddsLabel(p: number): string {
  if (p > 0 && p < 0.01) return "<1%";
  return pct(p);
}

// ---------------------------------------------------------------------------

/**
 * Career replay. The career is ALREADY simulated; this reveals it rung by rung
 * with the pre-fight odds, slowing on title/move-up fights and landing losses
 * hard. Whole run stays under ~6s; Skip jumps straight to the result.
 */
function SimScreen({ result, onDone }: { result: CareerResult; onDone: () => void }) {
  const { t } = useI18n();
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);
  const [shown, setShown] = useState(0);
  const total = result.fights.length;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const bell = setTimeout(() => sfx.bell(2), 0);
    const step = (i: number) => {
      if (cancelled) return;
      if (i >= total) {
        timer = setTimeout(() => doneRef.current(), 1000);
        return;
      }
      const f = result.fights[i];
      const delay = (f.kind === "normal" ? 300 : 520) + (f.win ? 0 : 300);
      timer = setTimeout(() => {
        setShown(i + 1);
        if (f.win) sfx.win(i + 1);
        else sfx.loss();
        // crowd swell going into the title fights
        const nextFight = result.fights[i + 1];
        if (f.win && f.kind === "normal" && nextFight && nextFight.kind !== "normal") sfx.crowd();
        step(i + 1);
      }, delay);
    };
    step(0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(bell);
    };
  }, [result, total]);

  const revealed = result.fights.slice(0, shown);
  const wins = revealed.filter((f) => f.win).length;
  const losses = shown - wins;
  const last = shown > 0 ? result.fights[shown - 1] : null;
  const lastLost = last ? !last.win : false;
  const next = shown < total ? result.fights[shown] : null;

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      {lastLost ? (
        <div
          key={`flash-${shown}`}
          className="animate-loss-flash pointer-events-none fixed inset-0 z-10 bg-red-600"
          aria-hidden
        />
      ) : null}

      <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-zinc-500">
        {t.goat.theCareer}
      </p>
      <div key={shown} className={`mt-2 text-center ${lastLost ? "animate-shake" : ""}`}>
        <div
          className={`animate-count text-7xl font-black leading-none tracking-tighter tabular-nums ${recordAccent(losses, wins)}`}
        >
          {wins}-{losses}
        </div>
      </div>

      {/* the fight about to happen */}
      <div className="mt-4 flex h-14 items-center justify-center">
        {next ? (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-2">
            <span className="text-[9px] font-black tracking-widest text-amber-400">{t.goat.upNext}</span>
            <span className="min-w-0 text-sm">
              <span className="block truncate font-bold">
                {next.label}
                {next.kind === "title" ? " 🏆" : next.kind === "moveup" ? " ▲" : ""}
              </span>
              <span className="block truncate text-[11px] text-zinc-500">
                {t.goat.vs} {next.oppName}
              </span>
            </span>
            <span className={`text-lg font-black tabular-nums ${probText(next.winProb)}`}>{pct(next.winProb)}</span>
          </div>
        ) : null}
      </div>

      <ol className="mt-3 space-y-1">
        {CAREER_LADDER.map((node, i) => {
          const fight = result.fights[i];
          const isRevealed = i < shown && !!fight;
          const isCurrent = i === shown && !!fight;
          const never = !fight; // career ended before this rung
          return (
            <li
              key={i}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-1.5 transition-all ${
                isRevealed
                  ? fight.win
                    ? "animate-rise border-emerald-500/30 bg-emerald-500/5"
                    : "animate-rise border-red-500/50 bg-red-500/10"
                  : isCurrent
                    ? "border-amber-500/50 bg-amber-500/5"
                    : never && shown >= total
                      ? "border-zinc-900 opacity-25"
                      : "border-zinc-800 bg-zinc-900/30 opacity-50"
              }`}
            >
              <span className="w-5 text-center text-xs font-bold tabular-nums text-zinc-600">{i + 1}</span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="flex items-center gap-1 truncate">
                  {node.label}
                  {node.kind === "title" ? <span className="text-amber-400">🏆</span> : null}
                  {node.kind === "moveup" ? <span className="text-sky-400">▲</span> : null}
                </span>
                {isRevealed ? (
                  <span className="block truncate text-[11px] text-zinc-500">
                    {t.goat.vs} {fight.oppName} · {fight.method}
                  </span>
                ) : null}
              </span>
              {isRevealed ? (
                <>
                  <span className={`text-[11px] font-bold tabular-nums ${probText(fight.winProb)}`}>
                    {pct(fight.winProb)}
                  </span>
                  <span
                    className={`w-9 text-right text-xs font-black ${fight.win ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {fight.win ? "WIN" : "LOSS"}
                  </span>
                </>
              ) : isCurrent ? (
                <span className="animate-now h-2 w-2 rounded-full bg-amber-400" />
              ) : (
                <span className="text-xs text-zinc-700">···</span>
              )}
            </li>
          );
        })}
      </ol>

      <button
        onClick={() => doneRef.current()}
        className="mt-4 self-center text-xs font-semibold uppercase tracking-widest text-zinc-600 transition hover:text-zinc-300"
      >
        {t.common.skip} ›
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------


function ResultScreen({
  result,
  seed,
  picks,
  user,
  challenge,
  portraitEnabled,
  onReplay,
}: {
  result: CareerResult;
  seed: string;
  picks: string[];
  user: SessionUser;
  challenge?: GoatChallengeInfo;
  portraitEnabled: boolean;
  onReplay: () => void;
}) {
  const { t } = useI18n();
  const a = result.attributes;
  // 12-1 = lost the triple-champ fight: the GOAT game's near miss
  useOutcomeSound(result.losses, result.losses === 1 && result.wins === 12);

  // ---- leaderboard submission (server-authoritative; mirrors the 30-0 game) ----
  // The result screen only ever renders client-side (it follows a client-only
  // sim phase), so localStorage can be read in lazy initializers.
  const [nick, setNick] = useState<string | null>(() => {
    try {
      return localStorage.getItem(NICK_KEY);
    } catch {
      return null;
    }
  });
  const [guestId] = useState(() => ensureGuestId());
  const [nickInput, setNickInput] = useState("");
  const [save, setSave] = useState<{ status: "idle" | "saving" | "saved" | "unsaved"; rank?: number }>(
    { status: "idle" },
  );
  const submitted = useRef(false);

  const submit = useCallback(
    async (nickname: string | null) => {
      if (submitted.current) return;
      submitted.current = true;
      setSave({ status: "saving" });
      try {
        const payload = user ? { seed, picks } : { seed, picks, nickname, guestId };
        const res = await fetch("/api/goat/run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setSave({ status: data.saved ? "saved" : "unsaved", rank: data.rank });
      } catch {
        setSave({ status: "unsaved" });
      }
    },
    [user, seed, picks, guestId],
  );

  // Auto-submit once we have an identity (Google user, or a saved nickname).
  // Deferred a tick so the "saving" state update isn't synchronous in the effect.
  useEffect(() => {
    if (submitted.current) return;
    const identity = user ? null : nick && guestId ? nick : undefined;
    if (identity === undefined) return;
    const id = setTimeout(() => submit(identity), 0);
    return () => clearTimeout(id);
  }, [user, nick, guestId, submit]);

  const onSaveNick = () => {
    const v = nickInput.trim().slice(0, 24);
    if (!v) return;
    try {
      localStorage.setItem(NICK_KEY, v);
    } catch {
      /* ignore */
    }
    setNick(v);
    submit(v);
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-8">
      {challenge ? <HeadToHead result={result} challenge={challenge} /> : null}

      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-6 text-center">
        <div
          className={`animate-pop text-8xl font-black leading-none tracking-tighter tabular-nums drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] ${recordAccent(result.losses, result.wins)}`}
        >
          {result.record}
        </div>
        <div className={`mt-3 text-xl font-black uppercase tracking-[0.2em] ${tierAccent(result.tier.label)}`}>
          {result.tier.label}
        </div>
        <div className="mt-1 text-sm text-zinc-500">{result.tier.blurb}</div>
        <div className="mt-3 text-sm font-semibold text-zinc-300">
          {t.goat.youBuilt} <span className="text-amber-300">{result.archetypeName}</span>
          {result.titlesWon > 0
            ? ` · ${result.titlesWon} ${result.titlesWon > 1 ? t.goat.titles : t.goat.title}`
            : ""}
        </div>
        <div className="mx-auto mt-5 max-w-[12rem]">
          <div className="mb-1 flex justify-between text-xs font-semibold text-zinc-500">
            <span>{t.goat.goatScore}</span>
            <span className="text-amber-300">{result.goatScore}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-fight"
              style={{ width: `${result.goatScore}%` }}
            />
          </div>
        </div>
        {result.synergies.length ? (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {result.synergies.map((s) => (
              <span
                key={s}
                className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300"
              >
                ⚡ {s}
              </span>
            ))}
          </div>
        ) : null}
        <RankBadge save={save} />
      </div>

      <p className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center text-sm leading-relaxed text-zinc-300">
        {result.narrative}
      </p>

      <EndingCards result={result} />

      {/* nickname prompt for guests with no name yet */}
      {!user && !nick ? (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold">{t.goat.joinLeaderboard}</p>
          <p className="mt-1 text-xs text-zinc-400">{t.goat.pickName}</p>
          <div className="mt-3 flex gap-2">
            <input
              value={nickInput}
              onChange={(e) => setNickInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSaveNick()}
              maxLength={24}
              placeholder={t.login.namePlaceholder}
              className="flex-1 rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-amber-400"
            />
            <button
              onClick={onSaveNick}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-black"
            >
              {t.common.save}
            </button>
          </div>
        </div>
      ) : null}

      <PortraitMaker
        picks={picks}
        sources={a.sources}
        archetypeName={result.archetypeName}
        portraitEnabled={portraitEnabled}
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <AttrPill label={t.goat.biggestStrength} data={result.biggestStrength} accent="text-emerald-400" />
        <AttrPill label={t.goat.biggestWeakness} data={result.biggestWeakness} accent="text-red-400" />
      </div>

      <ResemblanceCard attributes={a} />

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={onReplay}
          className="btn-fight py-4 active:scale-95 text-base"
        >
          {t.goat.buildAgain}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <ShareButton result={result} seed={seed} picks={picks} user={user} nick={nick} />
          <ChallengeButton seed={seed} picks={picks} user={user} nick={nick} />
        </div>
        <a
          href="/leaderboard?game=goat"
          className="text-center text-sm font-semibold text-zinc-400 underline-offset-4 hover:text-white hover:underline"
        >
          {t.goat.viewLeaderboard}
        </a>
      </div>

      {/* career log — who you fought, fight by fight */}
      <details className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-zinc-400">
          {t.goat.careerLog}
        </summary>
        <div className="max-h-72 overflow-y-auto px-2 pb-2">
          {result.fights.map((fight) => (
            <div
              key={fight.fight}
              className="flex items-center justify-between gap-2 border-t border-zinc-800/60 px-2 py-1.5 text-xs"
            >
              <span className="w-5 shrink-0 text-zinc-600">{fight.fight}</span>
              <span className="min-w-0 flex-1 truncate">
                <span className="text-zinc-300">
                  {fight.label}
                  {fight.kind === "title" ? " 🏆" : fight.kind === "moveup" ? " ▲" : ""}
                </span>
                <span className="block truncate text-[11px] text-zinc-500">
                  {t.goat.vs} {fight.oppName}
                </span>
              </span>
              <span className={`w-9 shrink-0 text-right font-bold tabular-nums ${probText(fight.winProb)}`}>
                {pct(fight.winProb)}
              </span>
              <span
                className={`w-6 shrink-0 text-center font-bold ${fight.win ? "text-emerald-400" : "text-red-400"}`}
              >
                {fight.win ? "W" : "L"}
              </span>
              <span className="w-24 shrink-0 truncate text-right text-zinc-500">{fight.method}</span>
            </div>
          ))}
        </div>
      </details>

      {/* the fused fighter */}
      <h3 className="mt-7 mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
        {t.goat.yourFighter}
      </h3>
      <div className="space-y-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
        {ORDER.map((k) => {
          const src = getPoolFighter(a.sources[k]);
          return (
            <div key={k} className="flex items-center gap-2.5">
              <FighterAvatar
                id={src.id}
                name={src.name}
                className={`h-8 w-8 shrink-0 rounded-full ring-1 ${k === "physique" ? "ring-amber-500/50" : "ring-zinc-700"}`}
                textClass="text-[10px]"
                sizes="32px"
              />
              <div className="min-w-0 flex-1">
                <StatBar label={SHORT[k]} value={a[k]} />
                <div className="truncate pl-[2.125rem] text-[10px] text-zinc-500">
                  {ATTR_LABEL[k]} · {src.name}
                  {k === "physique" ? ` · ${a.division}` : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * "What ended it" (the losing rung, the odds you had, the inherited flaw) and a
 * luck read: actual wins vs the build's style-averaged expectation. This is the
 * near-miss hook — it tells you whether to fix the build or just run it back.
 */
function EndingCards({ result }: { result: CareerResult }) {
  const { t } = useI18n();
  const proj = useMemo(() => projectCareer(result.attributes), [result.attributes]);
  const lossFight = result.fights.find((f) => !f.win) ?? null;
  const diff = result.wins - proj.expectedWins;
  const verdict = diff >= 0.75 ? t.goat.ranHot : diff <= -0.75 ? t.goat.ranCold : t.goat.onScript;
  const verdictColor = diff >= 0.75 ? "text-emerald-400" : diff <= -0.75 ? "text-red-400" : "text-zinc-300";
  const flawSrc = result.decidingLoss
    ? getPoolFighter(result.attributes.sources[result.decidingLoss.attribute])
    : null;

  return (
    <div className={`animate-rise mt-4 grid gap-3 ${lossFight ? "sm:grid-cols-2" : ""}`}>
      {lossFight ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-4">
          <div className="text-[10px] font-bold tracking-widest text-red-400">{t.goat.whatEndedIt}</div>
          <div className="mt-1 text-sm font-black">
            #{lossFight.fight} {lossFight.label}
            {lossFight.kind === "title" ? " 🏆" : lossFight.kind === "moveup" ? " ▲" : ""}
          </div>
          <div className="truncate text-[11px] text-zinc-500">
            {t.goat.vs} {lossFight.oppName} · {lossFight.method}
          </div>
          <p className="mt-2 text-xs text-zinc-300">
            {t.goat.youWere.split("{p}")[0]}
            <span className={`font-black ${probText(lossFight.winProb)}`}>{pct(lossFight.winProb)}</span>
            {t.goat.youWere.split("{p}")[1]}
          </p>
          {result.decidingLoss && flawSrc ? (
            <div className="mt-2 flex items-center gap-2">
              <FighterAvatar
                id={flawSrc.id}
                name={flawSrc.name}
                className="h-7 w-7 shrink-0 rounded-full ring-1 ring-red-500/50"
                textClass="text-[9px]"
                sizes="28px"
              />
              <span className="text-xs text-zinc-400">
                {t.goat.theFlaw
                  .replace("{attr}", ATTR_LABEL[result.decidingLoss.attribute])
                  .replace("{src}", result.decidingLoss.source)}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="text-[10px] font-bold tracking-widest text-amber-400">{t.goat.luck}</div>
        <div className={`mt-1 text-2xl font-black tabular-nums ${verdictColor}`}>
          {diff >= 0 ? "+" : ""}
          {diff.toFixed(1)} <span className="text-sm font-bold">{verdict}</span>
        </div>
        <p className="text-[11px] text-zinc-500">
          {t.goat.expectedVs
            .replace("{e}", proj.expectedWins.toFixed(1))
            .replace("{w}", String(result.wins))}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-black/40 p-1.5">
            <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{t.goat.beltOdds}</div>
            <div className={`text-lg font-black tabular-nums ${probText(proj.beltOdds)}`}>{pct(proj.beltOdds)}</div>
          </div>
          <div className="rounded-lg bg-black/40 p-1.5">
            <div className="text-[9px] font-bold uppercase tracking-widest text-amber-400">{t.goat.goatOdds}</div>
            <div className="text-lg font-black tabular-nums text-amber-300">{oddsLabel(proj.goatOdds)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PART_LABELS: { key: CategoryKey; label: string }[] = [
  { key: "striking", label: "The Hands" },
  { key: "wrestling", label: "The Takedowns" },
  { key: "submissions", label: "The Ground Game" },
  { key: "cardio", label: "The Gas Tank" },
  { key: "chin", label: "The Chin" },
  { key: "fightIq", label: "The Brain" },
];

function DefaultFighterCard({
  sources,
  archetypeName,
}: {
  sources: Record<CategoryKey, string>;
  archetypeName: string;
}) {
  const body = getPoolFighter(sources.physique);
  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-4">
      <div className="text-center">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          Your Franken-fighter
        </div>
        <div className="text-lg font-black text-amber-300">{archetypeName}</div>
      </div>
      <div className="mt-3 flex flex-col items-center">
        <FighterAvatar
          id={body.id}
          name={body.name}
          className="h-24 w-24 rounded-2xl ring-2 ring-amber-500/40"
          textClass="text-2xl"
          sizes="96px"
        />
        <div className="mt-1.5 text-xs font-bold">The Frame · {body.name}</div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {PART_LABELS.map((p) => {
          const f = getPoolFighter(sources[p.key]);
          return (
            <div
              key={p.key}
              className="flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900/40 p-2 text-center"
            >
              <FighterAvatar
                id={f.id}
                name={f.name}
                className="h-10 w-10 rounded-full ring-1 ring-zinc-700"
                textClass="text-[11px]"
                sizes="40px"
              />
              <div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                {p.label}
              </div>
              <div className="w-full truncate text-[10px] text-zinc-300">{f.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PortraitMaker({
  picks,
  sources,
  archetypeName,
  portraitEnabled,
}: {
  picks: string[];
  sources: Record<CategoryKey, string>;
  archetypeName: string;
  portraitEnabled: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "ai" | "default">("idle");
  const [img, setImg] = useState<string | null>(null);

  const generate = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/goat/portrait", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ picks }),
      });
      const data = res.ok ? await res.json() : null;
      if (data?.image) {
        setImg(data.image);
        setStatus("ai");
      } else {
        setStatus("default"); // no key / failure -> graceful default card
      }
    } catch {
      setStatus("default");
    }
  };

  const body = getPoolFighter(sources.physique).name;
  const hands = getPoolFighter(sources.striking).name;

  if (status === "ai" && img) {
    return (
      <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt="Your generated fighter"
          className="mx-auto aspect-square w-full max-w-sm rounded-xl object-cover"
        />
        <p className="mt-2 text-[11px] text-zinc-500">
          AI caricature · {body}’s frame, {hands}’s hands
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <a
            href={img}
            download="my-goat-fighter.png"
            className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs font-bold text-zinc-200 hover:bg-zinc-900"
          >
            Save image
          </a>
          <button
            onClick={generate}
            className="rounded-full border border-amber-500/50 px-4 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/10"
          >
            Regenerate
          </button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 py-8">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-amber-400" />
        <p className="text-sm text-zinc-400">Cooking up your fighter… (~15s)</p>
      </div>
    );
  }

  if (status === "default") {
    return (
      <div className="mt-4">
        <DefaultFighterCard sources={sources} archetypeName={archetypeName} />
        {portraitEnabled ? (
          <button
            onClick={generate}
            className="mt-2 w-full rounded-full border border-amber-500/50 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/10"
          >
            🎨 Try AI caricature again
          </button>
        ) : (
          <p className="mt-2 text-center text-[11px] text-zinc-600">
            Add an OpenAI key for an AI caricature version.
          </p>
        )}
      </div>
    );
  }

  // idle
  return (
    <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
      <p className="text-sm font-bold">See your Franken-fighter 🧬</p>
      <p className="mt-1 text-xs text-zinc-400">Built from your picks.</p>
      <button
        onClick={portraitEnabled ? generate : () => setStatus("default")}
        className="btn-fight mt-3 px-6 py-2.5 text-sm active:scale-95"
      >
        {portraitEnabled ? "🎨 Generate my fighter" : "Reveal my fighter card"}
      </button>
    </div>
  );
}

function AttrPill({
  label,
  data,
  accent,
}: {
  label: string;
  data: { attribute: CategoryKey; source: string };
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
      <div className={`text-[10px] font-bold tracking-widest ${accent}`}>{label}</div>
      <div className="mt-1 text-sm font-bold">{ATTR_LABEL[data.attribute]}</div>
      <div className="truncate text-[11px] text-zinc-500">from {data.source}</div>
    </div>
  );
}

/** "You fight like X" — the real fighter (±1 weight class) closest to the build. */
function ResemblanceCard({ attributes }: { attributes: BuildAttributes }) {
  const { t } = useI18n();
  const { fighterId, match } = useMemo(() => resemblance(attributes), [attributes]);
  const f = getPoolFighter(fighterId);
  return (
    <div
      style={{ animationDelay: "120ms" }}
      className="animate-rise card-sheen mt-4 flex items-center gap-4 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-4"
    >
      <FighterAvatar
        id={f.id}
        name={f.name}
        className="h-14 w-14 shrink-0 rounded-full ring-2 ring-amber-500/50"
        textClass="text-base"
        sizes="56px"
      />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">
          {t.goat.fightsLike}
        </div>
        <div className="truncate text-lg font-black tracking-tight">{f.name}</div>
        <div className="truncate text-xs text-zinc-500">
          {f.nickname ? `“${f.nickname}” · ` : ""}
          {f.division}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-2xl font-black tabular-nums text-amber-300">{match}%</div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          {t.goat.match}
        </div>
        <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-fight"
            style={{ width: `${match}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function RankBadge({ save }: { save: { status: string; rank?: number } }) {
  const { t } = useI18n();
  if (save.status === "saving")
    return <div className="mt-4 text-xs text-zinc-500">{t.goat.savingRank}</div>;
  if (save.status === "saved" && save.rank)
    return <div className="mt-4 text-sm font-bold text-amber-300">{t.goat.globalRank} #{save.rank}</div>;
  return null;
}

function HeadToHead({
  result,
  challenge,
}: {
  result: CareerResult;
  challenge: GoatChallengeInfo;
}) {
  const { t } = useI18n();
  const youBetter =
    result.wins > challenge.creatorWins ||
    (result.wins === challenge.creatorWins && result.goatScore > challenge.creatorGoat);
  const tie = result.wins === challenge.creatorWins && result.goatScore === challenge.creatorGoat;
  const verdict = tie
    ? t.goat.deadEven
    : youBetter
      ? t.goat.youWin
      : `${challenge.creatorName.toUpperCase()} ${t.goat.wins}`;
  const color = tie ? "text-zinc-300" : youBetter ? "text-emerald-400" : "text-red-400";
  return (
    <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
      <div className={`text-lg font-black ${color}`}>{verdict}</div>
      <div className="mt-2 flex items-center justify-center gap-4 text-sm">
        <span>
          {t.goat.you} <span className={`font-bold ${recordAccent(result.losses, result.wins)}`}>{result.record}</span>
        </span>
        <span className="text-zinc-600">{t.goat.vs}</span>
        <span className="text-zinc-300">
          {challenge.creatorName}{" "}
          <span className="font-bold">
            {challenge.creatorWins}-{challenge.creatorLosses}
          </span>
        </span>
      </div>
    </div>
  );
}

function ShareButton({
  result,
  seed,
  picks,
  user,
  nick,
}: {
  result: CareerResult;
  seed: string;
  picks: string[];
  user: SessionUser;
  nick: string | null;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const text = `I went ${result.record} in "Can You Become the GOAT?" 🥊 ${result.tier.label} · GOAT ${result.goatScore} · ${result.archetypeName}. Can you go 13-0?`;

  const getShareUrl = async () => {
    const res = await fetch("/api/goat/challenge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ seed, picks, name: user?.name ?? nick ?? "" }),
    });
    const data = await res.json();
    return data.id ? `${window.location.origin}/goat/challenge/${data.id}` : null;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-zinc-700 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-900"
      >
        {t.goat.share}
      </button>
      {open ? (
        <ShareModal
          title={t.goat.shareTitle}
          text={text}
          getShareUrl={getShareUrl}
          fallbackUrl={typeof window !== "undefined" ? `${window.location.origin}/goat` : ""}
          onClose={() => setOpen(false)}
          preview={<BuildShareCard result={result} />}
        />
      ) : null}
    </>
  );
}

function BuildShareCard({ result }: { result: CareerResult }) {
  const a = result.attributes;
  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            GOAT · {result.tier.label}
          </div>
          <div className={`text-4xl font-black tracking-tighter ${recordAccent(result.losses, result.wins)}`}>
            {result.record}
          </div>
          <div className="text-xs font-semibold text-amber-300">{result.archetypeName}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">GOAT</div>
          <div className="text-2xl font-black">{result.goatScore}</div>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        {TRAIT_KEYS.map((k) => {
          const src = getPoolFighter(a.sources[k]);
          return (
            <div key={k} className="flex items-center gap-2">
              <FighterAvatar
                id={src.id}
                name={src.name}
                className="h-7 w-7 rounded-full ring-1 ring-zinc-700"
                textClass="text-[10px]"
                sizes="28px"
              />
              <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                {ATTR_LABEL[k]}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold">{src.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChallengeButton({
  seed,
  picks,
  user,
  nick,
}: {
  seed: string;
  picks: string[];
  user: SessionUser;
  nick: string | null;
}) {
  const { t } = useI18n();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const onCreate = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/goat/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seed, picks, name: user?.name ?? nick ?? "" }),
      });
      const data = await res.json();
      if (data.id) {
        const url = `${window.location.origin}/goat/challenge/${data.id}`;
        const text = `Can you build a better fighter? ${url}`;
        if (navigator.share) await navigator.share({ title: "Beat my GOAT build", text });
        else await navigator.clipboard.writeText(url);
        setState("done");
        setTimeout(() => setState("idle"), 2200);
      } else {
        setState("idle");
      }
    } catch {
      setState("idle");
    }
  };
  return (
    <button
      onClick={onCreate}
      disabled={state === "loading"}
      className="rounded-full border border-amber-500/50 bg-amber-500/10 py-3 text-sm font-bold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-60"
    >
      {state === "loading" ? t.goat.creating : state === "done" ? t.goat.linkCopied : t.goat.beatMyBuild}
    </button>
  );
}
