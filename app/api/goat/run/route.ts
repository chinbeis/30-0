import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildBuildBoard, validateBuildPicks } from "@/lib/goat/board";
import { simulateCareer } from "@/lib/goat/engine";
import { insertGoatRun, rankForResult, type Identity } from "@/lib/queries";

const GOAT_ROUNDS = 7;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const { seed, picks, nickname, guestId } = (body ?? {}) as Record<string, unknown>;

  if (typeof seed !== "string" || !Array.isArray(picks) || picks.length !== GOAT_ROUNDS) {
    return NextResponse.json({ error: "invalid run" }, { status: 400 });
  }
  // Anti-cheat: picks must be legal for the build board this seed generates.
  if (!validateBuildPicks(buildBuildBoard(seed), picks as string[])) {
    return NextResponse.json({ error: "picks do not match board" }, { status: 400 });
  }
  // Authoritative simulation (deterministic — matches what the client showed).
  const result = simulateCareer({ picks: picks as string[], seed });

  const session = await auth();
  let identity: Identity | null = null;
  if (session?.user?.email) {
    const source = session.user.provider === "google" ? "google" : "email";
    identity = {
      playerKey: `${source}:${session.user.email}`,
      playerName: session.user.name || session.user.email,
      playerImage: session.user.image ?? null,
      playerSource: source,
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

  await insertGoatRun(identity, picks as string[], result);
  const rank = await rankForResult(result.wins, result.goatScore, "goat");
  return NextResponse.json({ result, saved: true, rank });
}
