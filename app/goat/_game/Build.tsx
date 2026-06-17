"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildBuildBoard, type BuildBoard, type BuildRound } from "@/lib/goat/board";
import {
  ATTR_LABEL,
  CAREER_LADDER,
  getPoolFighter,
  simulateCareer,
} from "@/lib/goat/engine";
import { traitTag } from "@/lib/goat/attributes";
import type { CareerResult, CategoryKey, TraitKey } from "@/lib/goat/types";
import type { Fighter } from "@/lib/game/types";
import { FighterAvatar } from "@/app/_game/FighterAvatar";

type Phase = "start" | "pick" | "sim" | "result";

const ROUNDS = 7;
const BEST_KEY = "goat:best";
type Best = { wins: number; record: string; goatScore: number; tier: string };

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

export default function Build() {
  const [phase, setPhase] = useState<Phase>("start");
  const [runId, setRunId] = useState("");
  const [board, setBoard] = useState<BuildBoard | null>(null);
  const [round, setRound] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const [result, setResult] = useState<CareerResult | null>(null);

  const start = useCallback(() => {
    const id = newRunId();
    setRunId(id);
    setBoard(buildBuildBoard(id));
    setRound(0);
    setPicks([]);
    setResult(null);
    setPhase("pick");
  }, []);

  const pick = useCallback(
    (fighterId: string) => {
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

  if (phase === "start") return <StartScreen onPlay={start} />;
  if (phase === "sim" && result)
    return <SimScreen result={result} onDone={() => setPhase("result")} />;
  if (phase === "result" && result)
    return <ResultScreen result={result} onReplay={start} />;
  if (phase === "pick" && board)
    return (
      <PickScreen
        key={round}
        round={board.rounds[round]}
        roundIndex={round}
        picks={picks}
        onPick={pick}
      />
    );
  return null;
}

// ---------------------------------------------------------------------------

function StartScreen({ onPlay }: { onPlay: () => void }) {
  const [best, setBest] = useState<Best | null>(null);
  useEffect(() => setBest(readBest()), []);
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-amber-500">
        Build the ultimate fighter
      </p>
      <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
        CAN YOU BECOME
        <span className="block bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">
          THE GOAT?
        </span>
      </h1>
      <p className="mt-6 max-w-md text-lg text-zinc-400">
        Steal one trait from a legend in each category. Build one fighter. Run the
        13-fight gauntlet to triple champ &mdash; undefeated, or not at all.
      </p>
      <button
        onClick={onPlay}
        className="mt-10 rounded-full bg-gradient-to-r from-amber-400 to-red-500 px-12 py-4 text-xl font-black text-black shadow-lg shadow-amber-500/20 transition hover:scale-105 active:scale-95"
      >
        BUILD YOUR FIGHTER
      </button>
      <p className="mt-6 text-xs text-zinc-600">~60 seconds · no sign-up</p>
      {best ? (
        <p className="mt-4 text-sm text-zinc-500">
          Your best:{" "}
          <span className={`font-bold ${tierAccent(best.tier)}`}>{best.record}</span> ·{" "}
          {best.tier} · GOAT {best.goatScore}
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

const TAG_COLOR: Record<string, string> = {
  Elite: "bg-amber-500/20 text-amber-300",
  Great: "bg-emerald-500/20 text-emerald-300",
  Solid: "bg-sky-500/20 text-sky-300",
  Average: "bg-zinc-700 text-zinc-300",
  Suspect: "bg-red-500/20 text-red-300",
};

function PickScreen({
  round,
  roundIndex,
  picks,
  onPick,
}: {
  round: BuildRound;
  roundIndex: number;
  picks: string[];
  onPick: (id: string) => void;
}) {
  const [rollIndex, setRollIndex] = useState(0);
  const [rolling, setRolling] = useState(false);
  const options = round.pages[rollIndex];
  const rollsLeft = round.pages.length - 1 - rollIndex;

  const onRoll = () => {
    if (rollsLeft <= 0 || rolling) return;
    setRolling(true);
    setTimeout(() => {
      setRollIndex((i) => i + 1);
      setRolling(false);
    }, 300);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
      <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-zinc-500">
        <span>
          Round {roundIndex + 1} / {ROUNDS}
        </span>
        <span>{picks.length} traits chosen</span>
      </div>
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-red-500 transition-all"
          style={{ width: `${(roundIndex / ROUNDS) * 100}%` }}
        />
      </div>

      <h2 className="text-center text-3xl font-black tracking-tight">{round.label}</h2>
      <p className="mb-5 text-center text-sm text-zinc-500">
        {round.physique ? "Choose your frame & division" : `Whose ${round.label.toLowerCase()} do you want?`}
      </p>

      {/* keyed by rollIndex so the cards replay their deal animation on every reroll */}
      <div key={rollIndex} className="grid flex-1 content-start gap-3 sm:grid-cols-3">
        {options.map((f, i) => (
          <TraitCard
            key={f.id}
            fighter={f}
            category={round.category}
            physique={round.physique}
            index={i}
            disabled={rolling}
            onClick={() => !rolling && onPick(f.id)}
          />
        ))}
      </div>

      {/* reroll control */}
      <div className="mt-5 flex flex-col items-center gap-1">
        <button
          onClick={onRoll}
          disabled={rollsLeft <= 0 || rolling}
          className="flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-500/10 px-6 py-2.5 text-sm font-bold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className={rolling ? "animate-roll inline-block" : "inline-block"}>🎲</span>
          {rollsLeft > 0 ? `Reroll options` : `No rerolls left`}
        </button>
        <div className="flex gap-1.5">
          {Array.from({ length: round.pages.length - 1 }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i < rollsLeft ? "bg-amber-400" : "bg-zinc-700"}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {Array.from({ length: ROUNDS }).map((_, i) => {
          const id = picks[i];
          return id ? (
            <FighterAvatar
              key={i}
              id={id}
              name={getPoolFighter(id).name}
              className="h-8 w-8 rounded-full ring-2 ring-zinc-700"
              textClass="text-[10px]"
              sizes="32px"
            />
          ) : (
            <div key={i} className="h-8 w-8 rounded-full border border-dashed border-zinc-700" />
          );
        })}
      </div>
    </div>
  );
}

function TraitCard({
  fighter,
  category,
  physique,
  index,
  disabled,
  onClick,
}: {
  fighter: Fighter;
  category: CategoryKey;
  physique: boolean;
  index: number;
  disabled: boolean;
  onClick: () => void;
}) {
  const tag = traitTag(fighter, category);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ animationDelay: `${index * 70}ms` }}
      className="animate-deal group flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-left transition hover:border-amber-500/60 hover:bg-zinc-900 active:scale-[0.98] sm:flex-col sm:items-center sm:text-center"
    >
      <FighterAvatar
        id={fighter.id}
        name={fighter.name}
        className="h-16 w-16 rounded-full ring-2 ring-zinc-700 transition group-hover:ring-amber-500/60 sm:h-20 sm:w-20"
        textClass="text-xl"
        sizes="80px"
      />
      <div className="min-w-0">
        <div className="truncate text-base font-bold leading-tight">{fighter.name}</div>
        {fighter.nickname ? (
          <div className="truncate text-xs italic text-zinc-500">&ldquo;{fighter.nickname}&rdquo;</div>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-1 sm:justify-center">
          {physique ? (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300">
              {fighter.division}
            </span>
          ) : (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${TAG_COLOR[tag] ?? "bg-zinc-700 text-zinc-300"}`}
            >
              {tag} {category === "fightIq" ? "IQ" : ""}
            </span>
          )}
          <span className="text-[10px] uppercase tracking-wide text-zinc-600">{fighter.era}</span>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------

function SimScreen({ result, onDone }: { result: CareerResult; onDone: () => void }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const [shown, setShown] = useState(0);
  const total = result.fights.length;

  useEffect(() => {
    const step = 280;
    const iv = setInterval(() => setShown((s) => Math.min(total, s + 1)), step);
    const t = setTimeout(() => {
      clearInterval(iv);
      doneRef.current();
    }, total * step + 900);
    return () => {
      clearInterval(iv);
      clearTimeout(t);
    };
  }, [total]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
      <p className="mb-5 text-center text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
        The career
      </p>
      <ol className="space-y-1.5">
        {CAREER_LADDER.map((node, i) => {
          const fight = result.fights[i];
          const revealed = i < shown && fight;
          const isTitle = node.kind === "title";
          const isMove = node.kind === "moveup";
          return (
            <li
              key={i}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition-all ${
                revealed
                  ? fight!.win
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/40 bg-red-500/10"
                  : "border-zinc-800 bg-zinc-900/30 opacity-50"
              }`}
            >
              <span className="w-5 text-center text-xs font-bold text-zinc-600">{i + 1}</span>
              <span className="flex-1 text-sm">
                {node.label}
                {isTitle ? <span className="ml-1 text-amber-400">🏆</span> : null}
                {isMove ? <span className="ml-1 text-sky-400">▲</span> : null}
              </span>
              {revealed ? (
                <span
                  className={`text-xs font-black ${fight!.win ? "text-emerald-400" : "text-red-400"}`}
                >
                  {fight!.win ? "WIN" : "LOSS"}
                </span>
              ) : i < shown ? null : (
                <span className="text-xs text-zinc-700">···</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------

function shareText(r: CareerResult, url: string): string {
  return [
    `I went ${r.record} in "Can You Become the GOAT?" 🥊`,
    `${r.tier.label} · GOAT Score ${r.goatScore}`,
    `Build: ${r.archetypeName}`,
    ``,
    `Can you go 13-0? ${url}`,
  ].join("\n");
}

function ResultScreen({ result, onReplay }: { result: CareerResult; onReplay: () => void }) {
  const [copied, setCopied] = useState(false);
  const a = result.attributes;

  const onShare = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/goat` : "";
    const text = shareText(result, url);
    try {
      if (navigator.share) await navigator.share({ title: "Can You Become the GOAT?", text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-8">
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-6 text-center">
        <div className={`text-7xl font-black tracking-tighter ${recordAccent(result.losses, result.wins)}`}>
          {result.record}
        </div>
        <div className={`mt-1 text-xl font-black uppercase tracking-widest ${tierAccent(result.tier.label)}`}>
          {result.tier.label}
        </div>
        <div className="mt-1 text-sm text-zinc-500">{result.tier.blurb}</div>
        <div className="mt-3 text-sm font-semibold text-zinc-300">
          You built <span className="text-amber-300">{result.archetypeName}</span>
          {result.titlesWon > 0 ? ` · ${result.titlesWon} title${result.titlesWon > 1 ? "s" : ""}` : ""}
        </div>
        <div className="mx-auto mt-5 max-w-[12rem]">
          <div className="mb-1 flex justify-between text-xs font-semibold text-zinc-500">
            <span>GOAT SCORE</span>
            <span className="text-amber-300">{result.goatScore}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-red-500"
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
      </div>

      <p className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center text-sm leading-relaxed text-zinc-300">
        {result.narrative}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <AttrPill label="BIGGEST STRENGTH" data={result.biggestStrength} accent="text-emerald-400" />
        <AttrPill label="BIGGEST WEAKNESS" data={result.biggestWeakness} accent="text-red-400" />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={onReplay}
          className="rounded-full bg-gradient-to-r from-amber-400 to-red-500 py-4 text-lg font-black text-black transition hover:scale-[1.02] active:scale-95"
        >
          BUILD AGAIN
        </button>
        <button
          onClick={onShare}
          className="rounded-full border border-zinc-700 py-3 font-bold text-zinc-200 transition hover:bg-zinc-900"
        >
          {copied ? "Copied! ✓" : "Share career"}
        </button>
      </div>

      {/* the fused fighter */}
      <h3 className="mt-7 mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
        Your fighter
      </h3>
      <div className="space-y-2">
        {TRAIT_KEYS.map((k) => {
          const src = getPoolFighter(a.sources[k]);
          const v = a[k];
          return (
            <div key={k} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-2">
              <FighterAvatar
                id={src.id}
                name={src.name}
                className="h-9 w-9 rounded-full ring-1 ring-zinc-700"
                textClass="text-[11px]"
                sizes="36px"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    {ATTR_LABEL[k]}
                  </span>
                  <span className="truncate pl-2 text-[11px] text-zinc-500">{src.name}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-red-500"
                    style={{ width: `${v}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-2 text-center text-xs text-zinc-400">
          Physique: <span className="font-bold text-amber-300">{a.division}</span> (from{" "}
          {getPoolFighter(a.sources.physique).name})
        </div>
      </div>
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
