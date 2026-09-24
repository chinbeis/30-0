"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildBoard, REROLLS_TOTAL, type Board } from "@/lib/game/board";
import {
  ROSTER_SIZE,
  TOTAL_BOUTS,
  ovr,
  seasonSchedule,
  simulateSeason,
  slotBoutIndexes,
  slotWinProbs,
  styleModifier,
  type Bout,
} from "@/lib/game/engine";
import { getFighter } from "@/lib/game/fighters";
import type { Archetype, Fighter, FightResult, SeasonResult } from "@/lib/game/types";
import {
  CARD_STATS,
  fighterTags,
  isLiabilityTag,
  methodFlavor,
  nightAwards,
  oddsPct,
  recordAccent,
  seasonOdds,
  styleLean,
} from "./helpers";
import { FighterAvatar } from "./FighterAvatar";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Dict } from "@/lib/i18n/dictionaries";
import { ShareModal } from "@/app/_components/ShareModal";
import { OvrBadge, StatBar, pct, probText, ratingText } from "@/app/_components/ratings";

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
  // Board and sim share the run seed, so the season's schedule (opponent level +
  // style per bout) is known before the first pick — the draft shows it.
  const schedule = useMemo(() => (runId ? seasonSchedule(runId) : null), [runId]);

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
        onReplay={start}
      />
    );
  if (phase === "pick" && board && schedule)
    return (
      <PickScreen
        key={round}
        roundNumber={board.rounds[round].round}
        options={rolled ?? board.rounds[round].options}
        roundIndex={round}
        picks={picks}
        schedule={schedule}
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
  schedule,
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
  schedule: Bout[];
  challenge?: ChallengeInfo;
  rerollsLeft: number;
  rolledKey: number;
  onReroll: () => void;
  onPick: (id: string) => void;
}) {
  const { t } = useI18n();
  const canReroll = rerollsLeft > 0;
  const bouts = slotBoutIndexes(roundIndex).map((i) => schedule[i]);
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      {challenge ? (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-sm">
          {t.game.beatPrefix} <span className="font-bold">{challenge.creatorName}</span>&rsquo;s{" "}
          <span className="font-bold text-amber-300">
            {challenge.creatorWins}-{challenge.creatorLosses}
          </span>{" "}
          {t.game.beatSuffix}
        </div>
      ) : null}

      <div className="xl:grid xl:grid-cols-[1fr_300px] xl:gap-6">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
            <span>
              {t.game.round} <span className="text-amber-400">{roundNumber}</span> / {ROSTER_SIZE}
            </span>
            <span className="tabular-nums">
              {picks.length} {t.game.drafted}
            </span>
          </div>
          <div className="mb-5 flex gap-1">
            {Array.from({ length: ROSTER_SIZE }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i < roundIndex
                    ? "bg-fight"
                    : i === roundIndex
                      ? "animate-now bg-fight/60"
                      : "bg-zinc-800"
                }`}
              />
            ))}
          </div>

          <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <h2 className="text-3xl font-black tracking-tight">{t.game.pickFighter}</h2>
            <StakesBanner bouts={bouts} />
          </div>

          {/* keyed by rolledKey so cards re-animate on each reroll */}
          <div key={rolledKey} className="grid content-start gap-3 md:grid-cols-3">
            {options.map((f, i) => (
              <FighterCard key={f.id} fighter={f} bouts={bouts} index={i} onClick={() => onPick(f.id)} />
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
        </div>

        <TeamPanel picks={picks} schedule={schedule} />
      </div>
    </div>
  );
}

function styleLabel(t: Dict, a: Archetype): string {
  return a === "striker"
    ? t.game.styleStriker
    : a === "wrestler"
      ? t.game.styleWrestler
      : a === "grappler"
        ? t.game.styleGrappler
        : t.game.styleBalanced;
}

/** The round's stakes: which 3 bouts this pick takes, opponent style + level. */
function StakesBanner({ bouts }: { bouts: Bout[] }) {
  const { t } = useI18n();
  const last = bouts[bouts.length - 1];
  const title = last.bout === TOTAL_BOUTS;
  const belt = !title && last.bout >= TOTAL_BOUTS - 4;
  return (
    <div className="flex flex-col items-center gap-1 sm:items-end">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        {t.game.stakes}
        {title ? (
          <span className="ml-1.5 text-amber-400">· 🏆 {t.game.titleFight}</span>
        ) : belt ? (
          <span className="ml-1.5 text-amber-400/80">· {t.game.beltOnLine}</span>
        ) : null}
      </div>
      <div className="flex gap-1.5">
        {bouts.map((b) => {
          const hot = b.bout >= TOTAL_BOUTS - 4;
          return (
            <div
              key={b.bout}
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] ${
                hot ? "border-amber-500/40 bg-amber-500/10" : "border-zinc-800 bg-zinc-900/60"
              }`}
            >
              <span className="font-black tabular-nums text-zinc-300">#{b.bout}</span>
              <span className="text-zinc-500">{styleLabel(t, b.oppArchetype)}</span>
              <span className={`font-bold tabular-nums ${hot ? "text-amber-300" : "text-zinc-300"}`}>{b.oppOvr}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FighterCard({
  fighter,
  bouts,
  index = 0,
  onClick,
}: {
  fighter: Fighter;
  bouts: Bout[];
  index?: number;
  onClick: () => void;
}) {
  const { t } = useI18n();
  const prime = !!fighter.isPrime;
  const mythic = !!fighter.isMythic;
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${index * 70}ms` }}
      className={`animate-deal card-sheen group relative flex flex-col gap-3 rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] ${
        mythic
          ? "animate-mythic border-fuchsia-400/70 bg-gradient-to-b from-fuchsia-500/15 via-purple-500/10 to-zinc-900/80 hover:border-fuchsia-300 hover:shadow-xl hover:shadow-fuchsia-500/30"
          : prime
            ? "animate-glow border-amber-400/70 bg-gradient-to-b from-amber-500/15 to-zinc-900/80 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/25"
            : "border-zinc-800 bg-zinc-900/60 hover:border-red-500/60 hover:bg-zinc-900 hover:shadow-xl hover:shadow-red-500/15"
      }`}
    >
      {/* mobile: one row (avatar · name · OVR); md+: avatar + OVR on top, name on its own full-width line */}
      <div className="flex items-center gap-3 md:flex-wrap md:items-start">
        {/* uniform framed thumbnail — same square crop on every photo (mixed sizes + monogram fallbacks) */}
        <FighterAvatar
          id={fighter.id}
          name={fighter.name}
          className={`h-16 w-16 shrink-0 rounded-xl ring-2 transition md:h-20 md:w-20 ${
            mythic
              ? "ring-fuchsia-400/80 group-hover:ring-fuchsia-300"
              : prime
                ? "ring-amber-400/80 group-hover:ring-amber-300"
                : "ring-zinc-700 group-hover:ring-red-500/60"
          }`}
          imgClassName="transition duration-500 ease-out group-hover:scale-105"
          textClass="text-xl"
          sizes="(min-width: 768px) 80px, 64px"
        />
        <div className="min-w-0 flex-1 md:order-last md:basis-full">
          {/* Rarity chips live IN the content flow — the card has overflow:hidden
              (card-sheen), so anything floated past its edge gets clipped. */}
          {mythic ? (
            <span className="mb-0.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-fuchsia-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-black shadow-md shadow-fuchsia-500/40">
              🔮 Mythical
            </span>
          ) : prime ? (
            <span className="mb-0.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-black shadow-md shadow-amber-500/40">
              ⭐ Prime
            </span>
          ) : null}
          <div className="truncate text-base font-black leading-tight">
            {prime ? fighter.name.replace(/^Prime /, "") : fighter.name}
          </div>
          {fighter.nickname ? (
            <div className="truncate text-[11px] italic text-zinc-500">&ldquo;{fighter.nickname}&rdquo;</div>
          ) : null}
          <div className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            {fighter.division} · {fighter.era}
          </div>
        </div>
        <div className="md:ml-auto">
          <OvrBadge value={ovr(fighter)} size="lg" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {fighterTags(fighter).map((tag) => (
          <span
            key={tag}
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              isLiabilityTag(tag)
                ? "border-red-500/25 bg-red-500/10 text-red-300"
                : "border-amber-500/20 bg-amber-500/10 text-amber-300"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {CARD_STATS.map((s) => (
          <StatBar key={s.key} label={s.label} value={fighter[s.key]} />
        ))}
      </div>

      {/* style matchup vs each of this slot's 3 opponents */}
      <div className="flex gap-1.5 border-t border-zinc-800/80 pt-2.5">
        {bouts.map((b) => {
          const m = styleModifier(fighter, b.oppArchetype);
          return (
            <span
              key={b.bout}
              title={`${styleLabel(t, b.oppArchetype)} · ${m > 0 ? t.game.favorable : m < 0 ? t.game.unfavorable : ""}`}
              className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-[10px] font-bold tabular-nums ${
                m > 0
                  ? "bg-emerald-500/10 text-emerald-300"
                  : m < 0
                    ? "bg-red-500/10 text-red-300"
                    : "bg-zinc-800/60 text-zinc-500"
              }`}
            >
              #{b.bout} {m > 0 ? "▲" : m < 0 ? "▼" : "•"}
            </span>
          );
        })}
      </div>
    </button>
  );
}

/** Live draft summary: picks so far, team OVR, style mix, projection. */
function TeamPanel({ picks, schedule }: { picks: string[]; schedule: Bout[] }) {
  const { t } = useI18n();
  const roster = picks.map(getFighter);
  const teamOvr = roster.length ? roster.reduce((s, f) => s + ovr(f), 0) / roster.length : 0;
  const probs = picks.map((id, r) => slotWinProbs(getFighter(id), schedule, r));
  const projWins = probs.flat().reduce((a, b) => a + b, 0);
  const unbeaten = probs.flat().reduce((a, b) => a * b, 1);
  const mix = { striker: 0, balanced: 0, grappler: 0 };
  roster.forEach((f) => mix[styleLean(f)]++);

  const stats = (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div>
        <div className={`text-xl font-black tabular-nums ${roster.length ? ratingText(teamOvr) : "text-zinc-600"}`}>
          {roster.length ? Math.round(teamOvr) : "—"}
        </div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{t.game.teamOvr}</div>
      </div>
      <div>
        <div className="text-xl font-black tabular-nums text-zinc-200">
          {roster.length ? `${projWins.toFixed(1)}` : "—"}
          <span className="text-xs text-zinc-500">/{picks.length * 3}</span>
        </div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{t.game.projected}</div>
      </div>
      <div title={t.game.unbeatenHint}>
        <div className={`text-xl font-black tabular-nums ${roster.length ? probText(unbeaten) : "text-zinc-600"}`}>
          {roster.length ? oddsPct(unbeaten) : "—"}
        </div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{t.game.unbeatenOdds}</div>
      </div>
    </div>
  );

  const mixBar = roster.length ? (
    <div className="mt-3">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div className="bg-red-400" style={{ width: `${(mix.striker / roster.length) * 100}%` }} />
        <div className="bg-zinc-400" style={{ width: `${(mix.balanced / roster.length) * 100}%` }} />
        <div className="bg-sky-400" style={{ width: `${(mix.grappler / roster.length) * 100}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[9px] font-bold uppercase tracking-wider">
        <span className="text-red-300">{t.game.styleStriker} {mix.striker}</span>
        <span className="text-zinc-400">{t.game.styleBalanced} {mix.balanced}</span>
        <span className="text-sky-300">{t.game.styleGrappler} {mix.grappler}</span>
      </div>
    </div>
  ) : null;

  return (
    <aside className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 xl:mt-0 xl:self-start">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">{t.game.yourTeam}</h3>
      {stats}
      {mixBar}

      {/* compact strip below xl; full slot list in the sidebar */}
      <div className="mt-4 flex flex-wrap justify-center gap-2 xl:hidden">
        {Array.from({ length: ROSTER_SIZE }).map((_, i) => {
          const id = picks[i];
          const newest = i === picks.length - 1;
          return id ? (
            <div key={i} className={newest ? "animate-tick" : undefined}>
              <FighterAvatar
                id={id}
                name={getFighter(id).name}
                className={`h-9 w-9 rounded-full ring-2 ${newest ? "ring-amber-400" : "ring-amber-500/40"}`}
                textClass="text-[10px]"
                sizes="36px"
              />
            </div>
          ) : (
            <div key={i} className="h-9 w-9 rounded-full border border-dashed border-zinc-800" />
          );
        })}
      </div>

      <ol className="mt-4 hidden space-y-1 xl:block">
        {Array.from({ length: ROSTER_SIZE }).map((_, i) => {
          const id = picks[i];
          if (!id)
            return (
              <li
                key={i}
                className="flex h-9 items-center rounded-lg border border-dashed border-zinc-800 px-2 text-[11px] text-zinc-600"
              >
                {t.game.emptySlot.replace("{n}", String(i + 1))}
              </li>
            );
          const f = getFighter(id);
          const exp = probs[i].reduce((a, b) => a + b, 0);
          return (
            <li
              key={i}
              className={`flex h-9 items-center gap-2 rounded-lg bg-zinc-900/70 px-2 ${i === picks.length - 1 ? "animate-rise" : ""}`}
            >
              <FighterAvatar
                id={id}
                name={f.name}
                className="h-6 w-6 shrink-0 rounded-full ring-1 ring-zinc-700"
                textClass="text-[9px]"
                sizes="24px"
              />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold">{f.name}</span>
              <span className={`text-xs font-black tabular-nums ${ratingText(ovr(f))}`}>{Math.round(ovr(f))}</span>
              <span className="w-12 text-right text-[10px] tabular-nums text-zinc-500">
                {exp.toFixed(1)} {t.game.proj}
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

// ---------------------------------------------------------------------------

/**
 * Live season ticker. The season is ALREADY simulated (result is final);
 * this only replays it fight-by-fight for drama: quick through the early
 * season, slowing into the title run, with a hard beat on every loss.
 */
function SimScreen({ result, onDone }: { result: SeasonResult; onDone: () => void }) {
  const { t } = useI18n();
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);
  const [done, setDone] = useState(0); // fights revealed so far (0..30)

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const step = (i: number) => {
      if (cancelled) return;
      if (i >= TOTAL_BOUTS) {
        timer = setTimeout(() => doneRef.current(), 1100);
        return;
      }
      // Pacing: early season flies, the title run slows down, losses land heavy.
      const base = i >= TOTAL_BOUTS - 5 ? 380 : i >= TOTAL_BOUTS - 12 ? 190 : 95;
      const lossBeat = result.fights[i].win ? 0 : 420;
      timer = setTimeout(() => {
        setDone(i + 1);
        step(i + 1);
      }, base + lossBeat);
    };
    step(0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [result]);

  const revealed = result.fights.slice(0, done);
  const wins = revealed.filter((f) => f.win).length;
  const losses = done - wins;
  const last = done > 0 ? result.fights[done - 1] : null;
  const lastLost = last ? !last.win : false;
  const titleRun = done >= TOTAL_BOUTS - 5;

  return (
    <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-4 py-10">
      {/* red impact flash when a loss lands (re-triggers via key) */}
      {lastLost ? (
        <div
          key={`flash-${done}`}
          className="animate-loss-flash pointer-events-none absolute inset-0 bg-red-600"
          aria-hidden
        />
      ) : null}

      <p className="text-xs font-bold uppercase tracking-[0.35em] text-zinc-500">
        {titleRun ? <span className="text-amber-400">🏆 {t.game.titleRun}</span> : t.game.simulating}
      </p>

      {/* live record — punches on every tick, shakes on a loss */}
      <div key={done} className={lastLost ? "animate-shake" : undefined}>
        <div
          className={`animate-count text-center text-8xl font-black leading-none tracking-tighter tabular-nums ${recordAccent(losses)}`}
        >
          {wins}-{losses}
        </div>
      </div>

      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400 tabular-nums">
        {t.game.fight} {Math.min(done + 1, TOTAL_BOUTS)} / {TOTAL_BOUTS}
      </p>

      {/* tale of the tape — the bout that just finished */}
      <div className="h-36 w-full">
        {last ? <TaleOfTape key={last.bout} fight={last} /> : null}
      </div>

      {/* season tape — 30 fights filling in */}
      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: TOTAL_BOUTS }).map((_, i) => {
          if (i < done)
            return (
              <span
                key={i}
                className={`animate-tick h-2.5 w-2.5 rounded-full ${
                  result.fights[i].win ? "bg-emerald-400" : "bg-red-500"
                }`}
              />
            );
          return (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${i === done ? "animate-now bg-amber-400" : "bg-zinc-800"}`}
            />
          );
        })}
      </div>

      <button
        onClick={() => doneRef.current()}
        className="mt-2 text-xs font-semibold uppercase tracking-widest text-zinc-600 transition hover:text-zinc-300"
      >
        {t.common.skip} ›
      </button>
    </div>
  );
}

function TaleOfTape({ fight }: { fight: FightResult }) {
  const { t } = useI18n();
  const f = getFighter(fight.fighterId);
  const opp = getFighter(fight.oppId);
  const side = (id: string, name: string, rating: number, won: boolean) => (
    <div className={`flex min-w-0 flex-col items-center gap-1.5 ${won ? "" : "opacity-60"}`}>
      <FighterAvatar
        id={id}
        name={name}
        className={`h-14 w-14 rounded-xl ring-2 ${won ? "ring-emerald-400" : "ring-zinc-700"}`}
        textClass="text-base"
        sizes="56px"
      />
      <span className="w-full truncate text-center text-xs font-bold">{name}</span>
      <span className={`text-[11px] font-black tabular-nums ${ratingText(rating)}`}>{Math.round(rating)}</span>
    </div>
  );
  return (
    <div
      className={`grid h-full grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border px-4 py-3 ${
        fight.win ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-red-500/40 bg-red-500/[0.07]"
      }`}
    >
      {side(f.id, f.name, ovr(f), fight.win)}
      <div className="flex flex-col items-center gap-1">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
            fight.win ? "bg-emerald-500 text-black" : "bg-red-500 text-white"
          }`}
        >
          {fight.win ? "W" : "L"}
        </span>
        <span className={`text-[11px] font-bold tabular-nums ${probText(fight.winProb)}`}>
          {pct(fight.winProb)}
        </span>
        <span className="max-w-[7rem] truncate text-center text-[10px] text-zinc-500">{methodFlavor(fight)}</span>
      </div>
      {side(opp.id, fight.oppName, fight.oppOvr, !fight.win)}
      <span className="sr-only">{t.game.vs}</span>
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
  // ResultScreen only ever mounts client-side (after a played season), so the
  // localStorage reads can live in lazy initializers — no hydration mismatch.
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

  const perfect = result.losses === 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
      {challenge ? <HeadToHead result={result} challenge={challenge} /> : null}

      <div
        className={`relative overflow-hidden rounded-3xl border bg-gradient-to-b from-zinc-900 to-black p-6 text-center ${
          perfect ? "animate-glow border-amber-500/50" : "border-zinc-800"
        }`}
      >
        {/* golden rays only for a perfect season */}
        {perfect ? (
          <div className="perfect-rays pointer-events-none absolute -inset-1/2" aria-hidden />
        ) : null}
        <div className="relative">
          <div
            className={`animate-pop text-8xl font-black leading-none tracking-tighter tabular-nums drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] ${
              perfect ? "text-shimmer-gold" : recordAccent(result.losses)
            }`}
          >
            {result.record}
          </div>
          <div className="mt-3 text-xl font-black uppercase tracking-[0.2em] text-white">
            {result.tier.label}
          </div>
          <div className="mt-1 text-sm text-zinc-500">{result.tier.blurb}</div>
        </div>
        <div className="relative mx-auto mt-5 max-w-[12rem]">
          <div className="mb-1 flex justify-between text-xs font-semibold text-zinc-500">
            <span>GOAT SCORE</span>
            <span className="text-amber-300">{result.goatScore}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-fight"
              style={{ width: `${result.goatScore}%` }}
            />
          </div>
        </div>
        <div className="relative">
          <RankBadge save={save} hasIdentity={!!user || !!nick} />
        </div>
      </div>

      <p
        className="animate-rise mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center text-sm leading-relaxed text-zinc-300"
        style={{ animationDelay: "150ms" }}
      >
        {result.story}
      </p>

      <LuckCard result={result} />
      <WhatCostYou result={result} />

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

      <div className="animate-rise mt-4 grid grid-cols-2 gap-3" style={{ animationDelay: "300ms" }}>
        <PlayerPill label={t.game.teamMvp} fighter={mvp} accent="text-emerald-400" />
        <PlayerPill label={t.game.weakestPick} fighter={weak} accent="text-red-400" />
      </div>

      <NightAwards result={result} />

      <div className="animate-rise mt-6 flex flex-col gap-3" style={{ animationDelay: "450ms" }}>
        <button
          onClick={onReplay}
          className="btn-fight animate-glow py-4 active:scale-95 text-base"
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

      <SeasonBreakdown result={result} />

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
                <span className={`w-9 shrink-0 text-right tabular-nums ${probText(fight.winProb)}`}>
                  {pct(fight.winProb)}
                </span>
                <span
                  className={`w-8 shrink-0 text-center font-bold ${fight.win ? "text-emerald-400" : "text-red-400"}`}
                >
                  {fight.win ? "W" : "L"}
                </span>
                <span className="w-32 shrink-0 truncate text-right text-zinc-500" title={fight.method}>
                  {methodFlavor(fight)}
                </span>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

/** Luck meter: actual wins vs the sum of pre-fight win probabilities. */
function LuckCard({ result }: { result: SeasonResult }) {
  const { t } = useI18n();
  const { expectedWins, perfectOdds } = seasonOdds(result);
  const diff = result.wins - expectedWins;
  const verdict =
    Math.abs(diff) < 0.5 ? t.game.onTheNumber : diff > 0 ? t.game.ranHot : t.game.ranCold;
  const accent = Math.abs(diff) < 0.5 ? "text-zinc-300" : diff > 0 ? "text-emerald-300" : "text-red-300";
  const oddsLine = (result.losses === 0 ? t.game.beatTheOdds : t.game.oddsWere).replace(
    "{p}",
    oddsPct(perfectOdds),
  );
  // Where actual wins land on a 20..30 scale, with the expectation marked.
  const pos = (w: number) => `${Math.max(0, Math.min(100, ((w - 20) / 10) * 100))}%`;
  return (
    <div
      className="animate-rise mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4"
      style={{ animationDelay: "220ms" }}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{t.game.luck}</span>
        <span className={`text-sm font-black tabular-nums ${accent}`}>
          {diff >= 0 ? "+" : ""}
          {diff.toFixed(1)} · {verdict}
        </span>
      </div>
      <div className="relative mt-3 h-2 rounded-full bg-zinc-800">
        <div
          className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-zinc-400"
          style={{ left: pos(expectedWins) }}
          title={t.game.expectedWins}
        />
        <div
          className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-black ${
            diff >= 0 ? "bg-emerald-400" : "bg-red-400"
          }`}
          style={{ left: pos(result.wins) }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
        <span>
          {t.game.expectedWins}{" "}
          <span className="font-bold tabular-nums text-zinc-300">{expectedWins.toFixed(1)}</span>
        </span>
        <span>
          {t.game.perfectOdds}{" "}
          <span className="font-bold tabular-nums text-amber-300">{oddsPct(perfectOdds)}</span>
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-400">{oddsLine}</p>
    </div>
  );
}

/** Every loss, biggest upset first — the near-miss, itemized. */
function WhatCostYou({ result }: { result: SeasonResult }) {
  const { t } = useI18n();
  const losses = result.fights.filter((f) => !f.win).sort((a, b) => b.winProb - a.winProb);
  if (!losses.length) return null;
  const shown = losses.slice(0, 5);
  return (
    <div
      className="animate-rise mt-4 rounded-2xl border border-red-500/25 bg-red-500/[0.04] p-4"
      style={{ animationDelay: "300ms" }}
    >
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">
        {t.game.whatCostYou} · {losses.length}
      </h3>
      <ul className="space-y-1.5">
        {shown.map((fight) => {
          const f = getFighter(fight.fighterId);
          const fav = fight.winProb >= 0.5;
          return (
            <li key={fight.bout} className="flex items-center gap-2.5 text-xs">
              <span className="w-7 shrink-0 font-black tabular-nums text-zinc-500">#{fight.bout}</span>
              <FighterAvatar
                id={f.id}
                name={f.name}
                className="h-7 w-7 shrink-0 rounded-full ring-1 ring-red-500/40"
                textClass="text-[9px]"
                sizes="28px"
              />
              <span className="min-w-0 flex-1 truncate">
                <span className="font-semibold text-zinc-200">{f.name}</span>
                <span className="text-zinc-600"> {t.game.vs} </span>
                <span className="text-zinc-400">{fight.oppName}</span>
              </span>
              <span className={`shrink-0 font-bold tabular-nums ${probText(fight.winProb)}`}>
                {pct(fight.winProb)} {fav ? t.game.favorite : t.game.underdog}
              </span>
              <span className="hidden w-24 shrink-0 truncate text-right text-zinc-500 sm:block">
                {methodFlavor(fight)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Per-fighter chart: OVR, the 3 bouts as W/L pips (bout # inside), expected vs actual. */
function SeasonBreakdown({ result }: { result: SeasonResult }) {
  const { t } = useI18n();
  return (
    <>
      <h3 className="mt-7 mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
        {t.game.seasonBreakdown}
      </h3>
      <div className="space-y-1.5">
        {result.perFighter.map((fs) => {
          const f = getFighter(fs.fighterId);
          const exp = fs.fights.reduce((s, x) => s + x.winProb, 0);
          const tag =
            fs.fighterId === result.mvpFighterId
              ? { text: "MVP", cls: "bg-emerald-500/15 text-emerald-300" }
              : fs.fighterId === result.weakestFighterId && fs.losses > 0
                ? { text: "⚠️", cls: "bg-red-500/15 text-red-300" }
                : null;
          return (
            <div
              key={fs.fighterId}
              className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-2.5 py-2"
            >
              <FighterAvatar
                id={fs.fighterId}
                name={f.name}
                className="h-9 w-9 shrink-0 rounded-full ring-1 ring-zinc-700"
                textClass="text-[11px]"
                sizes="36px"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-bold">{f.name}</span>
                  {tag ? (
                    <span className={`rounded px-1 text-[9px] font-black ${tag.cls}`}>{tag.text}</span>
                  ) : null}
                </div>
                <div className="text-[10px] tabular-nums text-zinc-500">
                  {exp.toFixed(1)} {t.game.proj}
                </div>
              </div>
              <span className={`w-7 text-center text-sm font-black tabular-nums ${ratingText(ovr(f))}`}>
                {Math.round(ovr(f))}
              </span>
              <div className="flex gap-1">
                {fs.fights.map((x) => (
                  <span
                    key={x.bout}
                    title={`#${x.bout} ${t.game.vs} ${x.oppName} · ${pct(x.winProb)} · ${methodFlavor(x)}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-black tabular-nums ${
                      x.win ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500 text-white"
                    }`}
                  >
                    {x.bout}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
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

/** The UFC bonus-check ritual — 🔥 Fight of the Night, 💰 Performance of the Night. */
function NightAwards({ result }: { result: SeasonResult }) {
  const { t } = useI18n();
  const { fotn, potn } = nightAwards(result);
  if (!fotn && !potn) return null;
  const awards = [
    fotn ? { emoji: "🔥", label: t.game.fotn, fight: fotn } : null,
    potn ? { emoji: "💰", label: t.game.potn, fight: potn } : null,
  ].filter(Boolean) as { emoji: string; label: string; fight: FightResult }[];
  return (
    <div
      className={`animate-rise mt-3 grid gap-3 ${awards.length === 2 ? "sm:grid-cols-2" : ""}`}
      style={{ animationDelay: "380ms" }}
    >
      {awards.map((a) => {
        const f = getFighter(a.fight.fighterId);
        return (
          <div
            key={a.label}
            className="flex items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-3"
          >
            <span className="text-xl" aria-hidden>
              {a.emoji}
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-widest text-amber-400">{a.label}</div>
              <div className="truncate text-sm font-bold">{f.name}</div>
              <div className="truncate text-[11px] text-zinc-500">
                {t.game.vs} {a.fight.oppName} · {methodFlavor(a.fight)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
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
