import { NextResponse } from "next/server";
import { topLeaderboard } from "@/lib/queries";

export async function GET() {
  try {
    const leaderboard = await topLeaderboard(100);
    return NextResponse.json({ leaderboard });
  } catch {
    return NextResponse.json({ leaderboard: [], error: "unavailable" }, { status: 500 });
  }
}
