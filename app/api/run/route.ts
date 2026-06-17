import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildBoard, validatePicks } from "@/lib/game/board";
import { ROSTER_SIZE, simulateSeason } from "@/lib/game/engine";
import { insertRun, rankForResult, type Identity } from "@/lib/queries";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const { seed, picks, mode, nickname, guestId } = (body ?? {}) as Record<string, unknown>;

  if (typeof seed !== "string" || !Array.isArray(picks) || picks.length !== ROSTER_SIZE) {
    return NextResponse.json({ error: "invalid run" }, { status: 400 });
  }
  // Anti-cheat: the picks must be legal for the board this seed generates.
  if (!validatePicks(buildBoard(seed), picks as string[])) {
    return NextResponse.json({ error: "picks do not match board" }, { status: 400 });
  }
  // Authoritative simulation (deterministic — matches what the client showed).
  const result = simulateSeason({ picks: picks as string[], seed });

  const session = await auth();
  let identity: Identity | null = null;
  if (session?.user?.email) {
    identity = {
      playerKey: `google:${session.user.email}`,
      playerName: session.user.name || session.user.email,
      playerImage: session.user.image ?? null,
      playerSource: "google",
    };
  } else if (
    typeof nickname === "string" &&
    nickname.trim() &&
    typeof guestId === "string" &&
    guestId
  ) {
    identity = {
      playerKey: `guest:${guestId}`,
      playerName: nickname.trim().slice(0, 24),
      playerImage: null,
      playerSource: "guest",
    };
  }

  if (!identity) {
    return NextResponse.json({ result, saved: false });
  }

  await insertRun(identity, seed, typeof mode === "string" ? mode : "endless", picks as string[], result);
  const rank = await rankForResult(result.wins, result.goatScore);
  return NextResponse.json({ result, saved: true, rank });
}
