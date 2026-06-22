import { NextResponse } from "next/server";
import { topLeaderboard, type Game, type LeaderboardRange } from "@/lib/queries";

function parseGame(v: string | null): Game {
  return v === "goat" ? "goat" : "30-0";
}
function parseRange(v: string | null): LeaderboardRange {
  return v === "weekly" || v === "daily" ? v : "all";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const game = parseGame(url.searchParams.get("game"));
  const range = parseRange(url.searchParams.get("range"));
  try {
    const leaderboard = await topLeaderboard(100, range, game);
    return NextResponse.json({ leaderboard, game, range });
  } catch {
    return NextResponse.json({ leaderboard: [], error: "unavailable" }, { status: 500 });
  }
}
