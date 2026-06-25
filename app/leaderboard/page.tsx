import type { Metadata } from "next";
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

function PlayerBadge({ row }: { row: LeaderboardRow }) {
  if (row.playerImage) {
    return (
      <Image
        src={row.playerImage}
        alt={row.playerName}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold text-white">
      {row.playerName.slice(0, 1).toUpperCase()}
    </div>
  );
}

const MEDAL = ["🥇", "🥈", "🥉"];

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

  let rows: LeaderboardRow[] = [];
  let errored = false;
  try {
    rows = await topLeaderboard(100, range, game);
  } catch {
    errored = true;
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-center text-4xl font-black tracking-tight sm:text-5xl">
        {t.leaderboard.title}
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-500">
        {game === "goat" ? t.leaderboard.subtitleGoat : t.leaderboard.subtitle30}
      </p>

      {/* Game switcher */}
      <div className="mt-6 flex justify-center">
        <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900/60 p-1">
          {GAMES.map((g) => {
            const active = g.key === game;
            return (
              <Link
                key={g.key}
                href={lbHref(g.key, range)}
                scroll={false}
                className={`rounded-full px-6 py-1.5 text-sm font-black transition ${
                  active
                    ? "bg-gradient-to-r from-amber-400 to-red-500 text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {g.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Time-range filter pills */}
      <div className="mt-3 flex justify-center">
        <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900/60 p-1">
          {RANGE_KEYS.map((key) => {
            const active = key === range;
            return (
              <Link
                key={key}
                href={lbHref(game, key)}
                scroll={false}
                className={`rounded-full px-5 py-1.5 text-sm font-bold transition ${
                  active
                    ? "bg-zinc-200 text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {rangeLabel[key]}
              </Link>
            );
          })}
        </div>
      </div>

      {errored ? (
        <p className="mt-16 text-center text-zinc-500">{t.leaderboard.unavailable}</p>
      ) : rows.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-zinc-400">
            {range === "all" ? t.leaderboard.noScores : t.leaderboard.noScoresWindow}
          </p>
          <Link
            href={game === "goat" ? "/goat" : "/play"}
            className="mt-5 inline-block rounded-full bg-gradient-to-r from-amber-400 to-red-500 px-8 py-3 font-black text-black transition hover:scale-105"
          >
            {t.leaderboard.playNow}
          </Link>
        </div>
      ) : (
        <ol className="mt-8 space-y-1.5">
          {rows.map((row, i) => {
            const top3 = row.rank <= 3;
            return (
              <li
                key={row.rank}
                style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                className={`animate-rise flex items-center gap-3 rounded-xl border px-3 py-3 transition duration-200 hover:-translate-y-0.5 ${
                  row.rank === 1
                    ? "border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                    : top3
                      ? "border-amber-500/40 bg-amber-500/[0.06]"
                      : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                }`}
              >
                <span
                  className={`flex w-8 justify-center text-base font-black tabular-nums ${
                    row.rank === 1
                      ? "text-amber-400"
                      : top3
                        ? "text-amber-300"
                        : "text-zinc-600"
                  }`}
                >
                  {top3 ? MEDAL[row.rank - 1] : row.rank}
                </span>
                <PlayerBadge row={row} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{row.playerName}</div>
                  <div className="text-[11px] uppercase tracking-wide text-zinc-500">
                    {row.tier}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-black tabular-nums ${recordAccent(row.losses)}`}>
                    {row.wins}-{row.losses}
                  </div>
                  <div className="text-[11px] text-zinc-500">GOAT {row.goatScore}</div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/"
          className="inline-block rounded-full border border-zinc-700 px-8 py-3 font-bold text-zinc-200 transition hover:bg-zinc-900"
        >
          {t.leaderboard.back}
        </Link>
      </div>
    </main>
  );
}
