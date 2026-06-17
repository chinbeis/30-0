import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { topLeaderboard, type LeaderboardRow } from "@/lib/queries";
import { recordAccent } from "../_game/helpers";

export const metadata: Metadata = {
  title: "Leaderboard · Can You Go 30-0?",
  description: "The best MMA rosters of all time. Ranked by record, then GOAT score.",
};

// Always render fresh (it's a live leaderboard).
export const dynamic = "force-dynamic";

function PlayerBadge({ row }: { row: LeaderboardRow }) {
  if (row.playerImage) {
    return (
      <Image
        src={row.playerImage}
        alt={row.playerName}
        width={28}
        height={28}
        className="rounded-full"
      />
    );
  }
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-white">
      {row.playerName.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default async function Leaderboard() {
  let rows: LeaderboardRow[] = [];
  let errored = false;
  try {
    rows = await topLeaderboard(100);
  } catch {
    errored = true;
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-center text-4xl font-black tracking-tight">Leaderboard</h1>
      <p className="mt-2 text-center text-sm text-zinc-500">
        All-time best rosters · ranked by record, then GOAT score
      </p>

      {errored ? (
        <p className="mt-12 text-center text-zinc-500">Leaderboard is temporarily unavailable.</p>
      ) : rows.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-zinc-400">No scores yet. Be the first.</p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-full bg-gradient-to-r from-amber-400 to-red-500 px-8 py-3 font-black text-black transition hover:scale-105"
          >
            Play now
          </Link>
        </div>
      ) : (
        <ol className="mt-8 space-y-1.5">
          {rows.map((row) => (
            <li
              key={row.rank}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                row.rank <= 3
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-zinc-800 bg-zinc-900/40"
              }`}
            >
              <span
                className={`w-7 text-center text-sm font-black ${
                  row.rank === 1
                    ? "text-amber-400"
                    : row.rank <= 3
                      ? "text-amber-300"
                      : "text-zinc-600"
                }`}
              >
                {row.rank}
              </span>
              <PlayerBadge row={row} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{row.playerName}</div>
                <div className="text-[11px] uppercase tracking-wide text-zinc-500">
                  {row.tier}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-base font-black ${recordAccent(row.losses)}`}>
                  {row.wins}-{row.losses}
                </div>
                <div className="text-[11px] text-zinc-500">GOAT {row.goatScore}</div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/"
          className="inline-block rounded-full border border-zinc-700 px-8 py-3 font-bold text-zinc-200 transition hover:bg-zinc-900"
        >
          ← Back to the game
        </Link>
      </div>
    </main>
  );
}
