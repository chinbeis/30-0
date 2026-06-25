"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildBoard, REROLLS_TOTAL, type Board } from "@/lib/game/board";
import { ROSTER_SIZE, TOTAL_BOUTS, simulateSeason } from "@/lib/game/engine";
import { getFighter } from "@/lib/game/fighters";
import type { Fighter, SeasonResult } from "@/lib/game/types";
import { fighterTags, recordAccent } from "./helpers";
import { FighterAvatar } from "./FighterAvatar";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ShareModal } from "@/app/_components/ShareModal";

type Phase = "start" | "pick" | "sim" | "result";

export type SessionUser = { name: string | null; image: string | null } | null;
export type ChallengeInfo = {
  id: string;
  seed: string;
  creatorName: string;
  creatorWins: number;
  creatorLosses: number;
  creatorGoat: number;
};

const BEST_KEY = "cyg300:best";
const NICK_KEY = "cyg300:nick";
const GUEST_KEY = "cyg300:guestId";

type Best = { wins: number; losses: number; goatScore: number; record: string };

function readBest(): Best | null {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    return raw ? (JSON.parse(raw) as Best) : null;
  } catch {
    return null;
  }
}
function saveIfBest(r: SeasonResult): void {
  try {
    const cur = readBest();
    const better = !cur || r.wins > cur.wins || (r.wins === cur.wins && r.goatScore > cur.goatScore);
    if (better)
      localStorage.setItem(
        BEST_KEY,
        JSON.stringify({ wins: r.wins, losses: r.losses, goatScore: r.goatScore, record: r.record }),
      );
  } catch {
    /* ignore */
  }
}
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
function newRunId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export default function Game({
  user,
  challenge,
}: {
  user?: SessionUser;
  challenge?: ChallengeInfo;
}) {
  const [phase, setPhase] = useState<Phase>(challenge ? "pick" : "start");
  const [runId, setRunId] = useState(challenge ? challenge.seed : "");
  const [board, setBoard] = useState<Board | null>(() =>
    challenge ? buildBoard(challenge.seed) : null,
  );
  const [round, setRound] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const [result, setResult] = useState<SeasonResult | null>(null);
  // Reroll: a shared budget across the whole draft. Each reroll reveals the next
  // unused reserve set; `rolled` overrides the current round's displayed options.
  const [rerollsUsed, setRerollsUsed] = useState(0);
  const [rolled, setRolled] = useState<Fighter[] | null>(null);

  const start = useCallback(() => {
    const id = challenge ? challenge.seed : newRunId();
    setRunId(id);
    setBoard(buildBoard(id));
    setRound(0);
    setPicks([]);
    setResult(null);
    setRerollsUsed(0);
    setRolled(null);
    setPhase("pick");
  }, [challenge]);

  const reroll = useCallback(() => {
    if (!board || rerollsUsed >= REROLLS_TOTAL) return;
    setRolled(board.rerollSets[rerollsUsed]);
    setRerollsUsed((n) => n + 1);
  }, [board, rerollsUsed]);

  const pick = useCallback(
    (fighterId: string) => {
      const next = [...picks, fighterId];
      setPicks(next);
      if (next.length === ROSTER_SIZE) {
        const r = simulateSeason({ picks: next, seed: runId });
        setResult(r);
        saveIfBest(r);
        setPhase("sim");
      } else {
        setRound((x) => x + 1);
        setRolled(null); // next round starts on its base options
      }
    },
    [picks, runId],
  );

  // Skip the description screen: start drafting immediately on entry. (A random
  // seed must be generated client-side, so we do it in an effect to avoid an
  // SSR/hydration mismatch.) Guarded so React strict-mode double-invoke is a no-op.
  const startedRef = useRef(false);
  useEffect(() => {
    if (challenge || startedRef.current) return;
    startedRef.current = true;
    start();
  }, [challenge, start]);

  if (phase === "start") return <Loading />;
  if (phase === "sim") return <SimScreen onDone={() => setPhase("result")} />;
  if (phase === "result" && result)
    return (
      <ResultScreen
        result={result}
        seed={runId}
        picks={picks}
        user={user ?? null}
        challenge={challenge}
        onReplay={start}
      />
    );
  if (phase === "pick" && board)
    return (
      <PickScreen
        key={round}
        roundNumber={board.rounds[round].round}
        options={rolled ?? board.rounds[round].options}
        roundIndex={round}
        picks={picks}
        challenge={challenge}
        rerollsLeft={REROLLS_TOTAL - rerollsUsed}
        rolledKey={rerollsUsed}
        onReroll={reroll}
        onPick={pick}
      />
    );
  return null;
}

// ---------------------------------------------------------------------------

function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-800 border-t-red-500" />
    </div>
  );
}

// ---------------------------------------------------------------------------

function PickScreen({
  roundNumber,
  options,
  roundIndex,
  picks,
  challenge,
  rerollsLeft,
  rolledKey,
  onReroll,
  onPick,
}: {
  roundNumber: number;
  options: Fighter[];
  roundIndex: number;
  picks: string[];
  challenge?: ChallengeInfo;
  rerollsLeft: number;
  rolledKey: number;
  onReroll: () => void;
  onPick: (id: string) => void;
}) {
  const { t } = useI18n();
  const canReroll = rerollsLeft > 0;
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
      {challenge ? (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-sm">
          {t.game.beatPrefix} <span className="font-bold">{challenge.creatorName}</span>&rsquo;s{" "}
          <span className="font-bold text-amber-300">
            {challenge.creatorWins}-{challenge.creatorLosses}
          </span>{" "}
          {t.game.beatSuffix}
        </div>
      ) : null}
      <div className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
        <span>
          {t.game.round} <span className="text-amber-400">{roundNumber}</span> / {ROSTER_SIZE}
        </span>
        <span className="tabular-nums">
          {picks.length} {t.game.drafted}
        </span>
      </div>
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-500 ease-out"
          style={{ width: `${(roundIndex / ROSTER_SIZE) * 100}%` }}
        />
      </div>

      <h2 className="mb-5 text-center text-3xl font-black tracking-tight">{t.game.pickFighter}</h2>

      {/* keyed by rolledKey so cards re-animate on each reroll */}
      <div key={rolledKey} className="grid flex-1 content-start gap-3 sm:grid-cols-3">
        {options.map((f, i) => (
          <FighterCard key={f.id} fighter={f} index={i} onClick={() => onPick(f.id)} />
        ))}
      </div>

      {/* reroll control — shared budget across the whole draft */}
      <div className="mt-5 flex flex-col items-center gap-1.5">
        <button
          onClick={onReroll}
          disabled={!canReroll}
          className="flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-500/10 px-6 py-2.5 text-sm font-bold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span aria-hidden>🎲</span>
          {canReroll ? `${t.game.reroll}  ·  ${rerollsLeft} ${t.game.left}` : t.game.noRerolls}
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: REROLLS_TOTAL }).map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${i < rerollsLeft ? "bg-amber-400" : "bg-zinc-700"}`}
            />
          ))}
          <span className="ml-1 text-[10px] uppercase tracking-wide text-zinc-600">
            {t.game.rerollsLeft}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {Array.from({ length: ROSTER_SIZE }).map((_, i) => {
          const id = picks[i];
          return id ? (
            <FighterAvatar
              key={i}
              id={id}
              name={getFighter(id).name}
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

function FighterCard({
  fighter,
  index = 0,
  onClick,
}: {
  fighter: Fighter;
  index?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${index * 70}ms` }}
      className="animate-deal group relative flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-left transition duration-200 hover:-translate-y-1 hover:border-red-500/60 hover:bg-zinc-900 hover:shadow-xl hover:shadow-red-500/10 active:translate-y-0 active:scale-[0.98] sm:flex-col sm:items-center sm:text-center"
    >
      {/* uniform framed thumbnail — same square crop on every photo (mixed sizes + monogram fallbacks) */}
      <FighterAvatar
        id={fighter.id}
        name={fighter.name}
        className="h-[4.5rem] w-[4.5rem] rounded-2xl ring-2 ring-zinc-700 transition group-hover:ring-red-500/60 sm:h-28 sm:w-28"
        imgClassName="transition duration-500 ease-out group-hover:scale-105"
        textClass="text-2xl"
        sizes="(min-width: 640px) 112px, 72px"
      />

      <div className="min-w-0 flex-1 sm:mt-1">
        <div className="truncate text-base font-black leading-tight sm:text-lg">{fighter.name}</div>
        {fighter.nickname ? (
          <div className="truncate text-xs italic text-zinc-500">
            &ldquo;{fighter.nickname}&rdquo;
          </div>
        ) : null}
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {fighter.division} · {fighter.era}
        </div>
        <div className="mt-2 flex flex-wrap gap-1 sm:justify-center">
          {fighterTags(fighter).map((t) => (
            <span
              key={t}
              className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* tap affordance on mobile */}
      <span
        className="shrink-0 pr-1 text-xl text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-red-400 sm:hidden"
        aria-hidden
      >
        ›
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------

function SimScreen({ onDone }: { onDone: () => void }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const [bout, setBout] = useState(1);
  useEffect(() => {
    const total = 1400;
    const iv = setInterval(() => setBout((b) => Math.min(TOTAL_BOUTS, b + 1)), total / TOTAL_BOUTS);
    const t = setTimeout(() => {
      clearInterval(iv);
      doneRef.current();
    }, total + 120);
    return () => {
      clearInterval(iv);
      clearTimeout(t);
    };
  }, []);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-zinc-800 border-t-red-500" />
      <p className="text-lg font-semibold uppercase tracking-[0.3em] text-zinc-400">
        Fight {bout} of {TOTAL_BOUTS}
      </p>
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
  onReplay,
}: {
  result: SeasonResult;
  seed: string;
  picks: string[];
  user: SessionUser;
  challenge?: ChallengeInfo;
  onReplay: () => void;
}) {
  const { t } = useI18n();
  const mvp = getFighter(result.mvpFighterId);
  const weak = getFighter(result.weakestFighterId);

  // ---- leaderboard submission ----
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
        const payload = user
          ? { seed, picks, mode: challenge ? "challenge" : "endless" }
          : { seed, picks, mode: challenge ? "challenge" : "endless", nickname, guestId };
        const res = await fetch("/api/run", {
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
    [user, seed, picks, guestId, challenge],
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
        <div
          className={`animate-pop text-8xl font-black leading-none tracking-tighter tabular-nums drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] ${recordAccent(result.losses)}`}
        >
          {result.record}
        </div>
        <div className="mt-3 text-xl font-black uppercase tracking-[0.2em] text-white">
          {result.tier.label}
        </div>
        <div className="mt-1 text-sm text-zinc-500">{result.tier.blurb}</div>
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
        <RankBadge save={save} hasIdentity={!!user || !!nick} />
      </div>

      <p className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center text-sm leading-relaxed text-zinc-300">
        {result.story}
      </p>

      {/* nickname prompt for guests with no name yet */}
      {!user && !nick ? (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold">{t.game.joinLeaderboard}</p>
          <p className="mt-1 text-xs text-zinc-400">{t.game.pickName}</p>
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

      <div className="mt-4 grid grid-cols-2 gap-3">
        <PlayerPill label={t.game.teamMvp} fighter={mvp} accent="text-emerald-400" />
        <PlayerPill label={t.game.weakestPick} fighter={weak} accent="text-red-400" />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={onReplay}
          className="rounded-full bg-gradient-to-r from-amber-400 to-red-500 py-4 text-lg font-black text-black transition hover:scale-[1.02] active:scale-95"
        >
          {t.game.playAgain}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <ShareButton result={result} seed={seed} picks={picks} user={user} nick={nick} />
          <ChallengeButton seed={seed} picks={picks} user={user} nick={nick} />
        </div>
        <a
          href="/leaderboard"
          className="text-center text-sm font-semibold text-zinc-400 underline-offset-4 hover:text-white hover:underline"
        >
          {t.game.viewLeaderboard}
        </a>
      </div>

      {/* roster */}
      <h3 className="mt-7 mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
        {t.game.yourRoster}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {result.perFighter.map((fs) => {
          const f = getFighter(fs.fighterId);
          const perfect = fs.losses === 0;
          return (
            <div
              key={fs.fighterId}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-2"
            >
              <FighterAvatar
                id={fs.fighterId}
                name={f.name}
                className="h-9 w-9 rounded-full ring-1 ring-zinc-700"
                textClass="text-[11px]"
                sizes="36px"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold">{f.name}</div>
                <div
                  className={`text-[11px] font-bold ${perfect ? "text-emerald-400" : fs.wins === 0 ? "text-red-400" : "text-zinc-400"}`}
                >
                  {fs.wins}-{fs.losses}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <details className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-zinc-400">
          {t.game.fightLog}
        </summary>
        <div className="max-h-72 overflow-y-auto px-2 pb-2">
          {result.fights.map((fight) => {
            const f = getFighter(fight.fighterId);
            return (
              <div
                key={fight.bout}
                className="flex items-center justify-between gap-2 border-t border-zinc-800/60 px-2 py-1.5 text-xs"
              >
                <span className="w-6 shrink-0 text-zinc-600">{fight.bout}</span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="text-zinc-300">{f.name}</span>
                  <span className="text-zinc-600"> {t.game.vs} </span>
                  <span className="text-zinc-400">{fight.oppName}</span>
                </span>
                <span
                  className={`w-8 shrink-0 text-center font-bold ${fight.win ? "text-emerald-400" : "text-red-400"}`}
                >
                  {fight.win ? "W" : "L"}
                </span>
                <span className="w-20 text-right text-zinc-500">{fight.method}</span>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

function RankBadge({
  save,
  hasIdentity,
}: {
  save: { status: string; rank?: number };
  hasIdentity: boolean;
}) {
  const { t } = useI18n();
  if (save.status === "saving")
    return <div className="mt-4 text-xs text-zinc-500">{t.game.savingRank}</div>;
  if (save.status === "saved" && save.rank)
    return (
      <div className="mt-4 text-sm font-bold text-amber-300">
        {t.game.globalRank} #{save.rank}
      </div>
    );
  if (!hasIdentity) return null;
  return null;
}

function HeadToHead({
  result,
  challenge,
}: {
  result: SeasonResult;
  challenge: ChallengeInfo;
}) {
  const { t } = useI18n();
  const youBetter =
    result.wins > challenge.creatorWins ||
    (result.wins === challenge.creatorWins && result.goatScore > challenge.creatorGoat);
  const tie = result.wins === challenge.creatorWins && result.goatScore === challenge.creatorGoat;
  const verdict = tie
    ? t.game.deadEven
    : youBetter
      ? t.game.youWin
      : `${challenge.creatorName.toUpperCase()} ${t.game.wins}`;
  const color = tie ? "text-zinc-300" : youBetter ? "text-emerald-400" : "text-red-400";
  return (
    <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
      <div className={`text-lg font-black ${color}`}>{verdict}</div>
      <div className="mt-2 flex items-center justify-center gap-4 text-sm">
        <span>
          {t.game.you}{" "}
          <span className={`font-bold ${recordAccent(result.losses)}`}>{result.record}</span>
        </span>
        <span className="text-zinc-600">{t.game.vs}</span>
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
  result: SeasonResult;
  seed: string;
  picks: string[];
  user: SessionUser;
  nick: string | null;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  // Brag line without the url (each platform appends/receives the url separately).
  const text = `I went ${result.record} in "Can You Go 30-0?" 🥊 ${result.tier.label} · GOAT ${result.goatScore}. Can you go perfect?`;

  // The shareable link is a challenge link: it reproduces this exact season and
  // unfurls with our OG image card.
  const getShareUrl = async () => {
    const res = await fetch("/api/challenge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ seed, picks, name: user?.name ?? nick ?? "" }),
    });
    const data = await res.json();
    return data.id ? `${window.location.origin}/challenge/${data.id}` : null;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-zinc-700 py-3 text-sm font-bold text-zinc-200 transition hover:bg-zinc-900"
      >
        {t.game.share}
      </button>
      {open ? (
        <ShareModal
          title={t.game.shareTitle}
          text={text}
          getShareUrl={getShareUrl}
          fallbackUrl={typeof window !== "undefined" ? window.location.origin : ""}
          onClose={() => setOpen(false)}
          preview={<RosterShareCard result={result} />}
        />
      ) : null}
    </>
  );
}

function RosterShareCard({ result }: { result: SeasonResult }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            30-0 · {result.tier.label}
          </div>
          <div className={`text-4xl font-black tracking-tighter ${recordAccent(result.losses)}`}>
            {result.record}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">GOAT</div>
          <div className="text-2xl font-black">{result.goatScore}</div>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        {result.perFighter.map((fs) => {
          const f = getFighter(fs.fighterId);
          return (
            <div key={fs.fighterId} className="flex items-center gap-2">
              <FighterAvatar
                id={fs.fighterId}
                name={f.name}
                className="h-7 w-7 rounded-full ring-1 ring-zinc-700"
                textClass="text-[10px]"
                sizes="28px"
              />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold">{f.name}</span>
              <span
                className={`text-[11px] font-bold tabular-nums ${fs.losses === 0 ? "text-emerald-400" : fs.wins === 0 ? "text-red-400" : "text-zinc-400"}`}
              >
                {fs.wins}-{fs.losses}
              </span>
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
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seed, picks, name: user?.name ?? nick ?? "" }),
      });
      const data = await res.json();
      if (data.id) {
        const url = `${window.location.origin}/challenge/${data.id}`;
        const text = `Can you beat my MMA team? ${url}`;
        if (navigator.share) await navigator.share({ title: "Can you beat my team?", text });
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
      {state === "loading" ? t.game.creating : state === "done" ? t.game.linkCopied : t.game.beatMyTeam}
    </button>
  );
}

function PlayerPill({ label, fighter, accent }: { label: string; fighter: Fighter; accent: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
      <FighterAvatar
        id={fighter.id}
        name={fighter.name}
        className="h-12 w-12 rounded-full ring-2 ring-zinc-700"
        textClass="text-sm"
        sizes="48px"
      />
      <div className="min-w-0">
        <div className={`text-[10px] font-bold tracking-widest ${accent}`}>{label}</div>
        <div className="truncate text-sm font-bold">{fighter.name}</div>
      </div>
    </div>
  );
}
