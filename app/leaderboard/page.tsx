import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  topLeaderboard,
  type Game,
  type LeaderboardRange,
  type LeaderboardRow,
} from "@/lib/queries";
import { recordAccent } from "../_game/helpers";
import { getT } from "@/lib/i18n/server";
import { LeaderboardListSkeleton } from "./skeletons";

export const metadata: Metadata = {
  title: "Leaderboard · Can You Go 30-0?",
  description: "The best MMA rosters of all time. Ranked by record, then GOAT score.",
};

// Always render fresh (it's a live leaderboard).
export const dynamic = "force-dynamic";

const RANGE_KEYS: LeaderboardRange[] = ["all", "weekly", "daily"];

const GAMES: { key: Game; label: string }[] = [
  { key: "30-0", label: "30-0" },
  { key: "goat", label: "GOAT" },
];

function parseRange(value: string | string[] | undefined): LeaderboardRange {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "weekly" || v === "daily" ? v : "all";
}

function parseGame(value: string | string[] | undefined): Game {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "goat" ? "goat" : "30-0";
}

/** Build a /leaderboard URL preserving the other filter. */
function lbHref(game: Game, range: LeaderboardRange): string {
  const params = new URLSearchParams();
  if (game !== "30-0") params.set("game", game);
  if (range !== "all") params.set("range", range);
  const qs = params.toString();
  return qs ? `/leaderboard?${qs}` : "/leaderboard";
}

function PlayerBadge({ row, size }: { row: LeaderboardRow; size: number }) {
  if (row.playerImage) {
    return (
      <Image
        src={row.playerImage}
        alt={row.playerName}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-zinc-800 font-bold text-zinc-200"
    >
      {row.playerName.slice(0, 1).toUpperCase()}
    </div>
  );
}

// Podium styling per place: gold / silver / bronze.
const PLACE = [
  { ring: "ring-amber-400", text: "text-amber-400", lift: "sm:-mt-6" },
  { ring: "ring-zinc-300", text: "text-zinc-300", lift: "" },
  { ring: "ring-orange-400", text: "text-orange-400", lift: "" },
];

export default async function Leaderboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const game = parseGame(sp.game);
  const t = await getT();
  const rangeLabel: Record<LeaderboardRange, string> = {
    all: t.leaderboard.allTime,
    weekly: t.leaderboard.weekly,
    daily: t.leaderboard.daily,
  };

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-display text-5xl sm:text-6xl">{t.leaderboard.title}</h1>
        <div className="flex rounded-md border border-white/10 bg-black/60 p-0.5">
          {GAMES.map((g) => {
            const active = g.key === game;
            return (
              <Link
                key={g.key}
                href={lbHref(g.key, range)}
                scroll={false}
                className={`font-display rounded px-4 py-1.5 text-lg transition ${
                  active ? "bg-fight text-white" : "text-zinc-500 hover:text-white"
                }`}
              >
                {g.label}
              </Link>
            );
          })}
        </div>
      </div>

      <nav className="mt-5 flex gap-5 border-b border-white/10 text-sm font-bold uppercase tracking-wider">
        {RANGE_KEYS.map((key) => {
          const active = key === range;
          return (
            <Link
              key={key}
              href={lbHref(game, key)}
              scroll={false}
              className={`-mb-px border-b-2 pb-2.5 transition ${
                active ? "border-fight text-white" : "border-transparent text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {rangeLabel[key]}
            </Link>
          );
        })}
      </nav>

      {/* Only the live-queried list streams behind a skeleton — the header and
          filters above stay instant, so switching filters feels snappy. The key
          re-triggers the skeleton on every game/range change. */}
      <Suspense key={`${game}-${range}`} fallback={<LeaderboardListSkeleton />}>
        <LeaderboardRows game={game} range={range} />
      </Suspense>
    </main>
  );
}

// The slow part: the live DB query. Isolated in its own async component so it
// can stream behind the <Suspense> skeleton without blocking the page shell.
async function LeaderboardRows({ game, range }: { game: Game; range: LeaderboardRange }) {
  const t = await getT();

  let rows: LeaderboardRow[] = [];
  let errored = false;
  try {
    rows = await topLeaderboard(100, range, game);
  } catch {
    errored = true;
  }

  if (errored) {
    return <p className="mt-16 text-center text-zinc-500">{t.leaderboard.unavailable}</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="mt-16 text-center">
        <p className="text-zinc-400">
          {range === "all" ? t.leaderboard.noScores : t.leaderboard.noScoresWindow}
        </p>
        <Link href={game === "goat" ? "/goat" : "/play"} className="btn-fight mt-5 px-8 py-3 text-sm">
          {t.leaderboard.playNow}
        </Link>
      </div>
    );
  }

  const podium = rows.length >= 3 ? rows.slice(0, 3) : [];
  const rest = rows.slice(podium.length);

  return (
    <>
      {podium.length > 0 && (
        <ol className="mt-10 grid grid-cols-3 items-end gap-2 sm:gap-3">
          {/* Visual order 2-1-3 so the champion sits in the middle. */}
          {[podium[1], podium[0], podium[2]].map((row, i) => {
            const place = PLACE[row.rank - 1];
            return (
              <li
                key={row.rank}
                style={{ animationDelay: `${i * 70}ms` }}
                className={`animate-rise flex min-w-0 flex-col items-center rounded-lg border border-white/10 bg-black/60 px-2 pt-4 pb-3 text-center backdrop-blur-sm ${place.lift} ${
                  row.rank === 1 ? "border-amber-400/40" : ""
                }`}
              >
                <span className={`font-display text-3xl ${place.text}`}>{row.rank}</span>
                <div className={`mt-2 rounded-full ring-2 ring-offset-2 ring-offset-black ${place.ring}`}>
                  <PlayerBadge row={row} size={row.rank === 1 ? 64 : 52} />
                </div>
                <div className="mt-3 w-full truncate text-sm font-semibold">{row.playerName}</div>
                <div className={`font-display mt-1 text-3xl tabular-nums sm:text-4xl ${recordAccent(row.losses)}`}>
                  {row.wins}-{row.losses}
                </div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {t.leaderboard.goat} {row.goatScore}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {rest.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-black/60 backdrop-blur-sm">
          <div className="grid grid-cols-[2.5rem_1fr_4.5rem_3.5rem] items-center gap-2 border-b border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <span className="text-center">#</span>
            <span>{t.leaderboard.player}</span>
            <span className="text-right">{t.leaderboard.record}</span>
            <span className="text-right">{t.leaderboard.goat}</span>
          </div>
          <ol className="divide-y divide-white/5">
            {rest.map((row, i) => (
              <li
                key={row.rank}
                style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
                className="animate-rise grid grid-cols-[2.5rem_1fr_4.5rem_3.5rem] items-center gap-2 px-3 py-2.5 transition hover:bg-white/[0.03]"
              >
                <span className="text-center text-sm font-bold tabular-nums text-zinc-500">{row.rank}</span>
                <div className="flex min-w-0 items-center gap-2.5">
                  <PlayerBadge row={row} size={32} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{row.playerName}</div>
                    <div className="truncate text-[10px] uppercase tracking-wider text-zinc-500">{row.tier}</div>
                  </div>
                </div>
                <span className={`font-display text-right text-2xl tabular-nums ${recordAccent(row.losses)}`}>
                  {row.wins}-{row.losses}
                </span>
                <span className="text-right text-sm font-semibold tabular-nums text-zinc-400">{row.goatScore}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}
