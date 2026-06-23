"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildBuildBoard,
  REROLLS_TOTAL,
  type BuildBoard,
  type BuildRound,
} from "@/lib/goat/board";
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
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ShareModal } from "@/app/_components/ShareModal";

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
  const options = round.pages[rollIndex];
  // gated by the shared draft-wide budget AND how many pages this round has
  const canRoll = rerollsLeft > 0 && rollIndex < round.pages.length - 1 && !rolling;

  const onRoll = () => {
    if (!canRoll) return;
    setRolling(true);
    setTimeout(() => {
      setRollIndex((i) => i + 1);
      onReroll();
      setRolling(false);
    }, 300);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
      <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-zinc-500">
        <span>
          {t.goat.round} {roundIndex + 1} / {ROUNDS}
        </span>
        <span>
          {picks.length} {t.goat.traitsChosen}
        </span>
      </div>
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-red-500 transition-all"
          style={{ width: `${(roundIndex / ROUNDS) * 100}%` }}
        />
      </div>

      <h2 className="text-center text-3xl font-black tracking-tight">{round.label}</h2>
      <p className="mb-5 text-center text-sm text-zinc-500">
        {round.physique
          ? t.goat.chooseFrame
          : t.goat.whose.replace("{trait}", round.label.toLowerCase())}
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
  const { t } = useI18n();
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
        {t.goat.theCareer}
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
              <span className="min-w-0 flex-1 text-sm">
                <span className="flex items-center gap-1">
                  {node.label}
                  {isTitle ? <span className="text-amber-400">🏆</span> : null}
                  {isMove ? <span className="text-sky-400">▲</span> : null}
                </span>
                {revealed ? (
                  <span className="block truncate text-[11px] text-zinc-500">
                    {t.goat.vs} {fight!.oppName}
                  </span>
                ) : null}
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

  // ---- leaderboard submission (server-authoritative; mirrors the 30-0 game) ----
  const [nick, setNick] = useState<string | null>(null);
  const [guestId, setGuestId] = useState("");
  const [nickInput, setNickInput] = useState("");
  const [save, setSave] = useState<{ status: "idle" | "saving" | "saved" | "unsaved"; rank?: number }>(
    { status: "idle" },
  );
  const submitted = useRef(false);

  useEffect(() => {
    setGuestId(ensureGuestId());
    try {
      setNick(localStorage.getItem(NICK_KEY));
    } catch {
      /* ignore */
    }
  }, []);

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
  useEffect(() => {
    if (submitted.current) return;
    if (user) submit(null);
    else if (nick && guestId) submit(nick);
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
        <div className={`text-7xl font-black tracking-tighter ${recordAccent(result.losses, result.wins)}`}>
          {result.record}
        </div>
        <div className={`mt-1 text-xl font-black uppercase tracking-widest ${tierAccent(result.tier.label)}`}>
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
        <RankBadge save={save} />
      </div>

      <p className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center text-sm leading-relaxed text-zinc-300">
        {result.narrative}
      </p>

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

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={onReplay}
          className="rounded-full bg-gradient-to-r from-amber-400 to-red-500 py-4 text-lg font-black text-black transition hover:scale-[1.02] active:scale-95"
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
              <span
                className={`w-8 shrink-0 text-center font-bold ${fight.win ? "text-emerald-400" : "text-red-400"}`}
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
        className="mt-3 rounded-full bg-gradient-to-r from-amber-400 to-red-500 px-6 py-2.5 text-sm font-black text-black transition hover:scale-105 active:scale-95"
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
