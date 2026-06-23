import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildBoard, validatePicks } from "@/lib/game/board";
import { ROSTER_SIZE, simulateSeason } from "@/lib/game/engine";
import { createChallenge } from "@/lib/queries";
import { clientIp, rateLimit, tooMany } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const rl = await rateLimit(`challenge:${clientIp(req)}`, 20, 60);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const { seed, picks, name } = (body ?? {}) as Record<string, unknown>;

  if (typeof seed !== "string" || !Array.isArray(picks) || picks.length !== ROSTER_SIZE) {
    return NextResponse.json({ error: "invalid challenge" }, { status: 400 });
  }
  if (!validatePicks(buildBoard(seed), picks as string[])) {
    return NextResponse.json({ error: "picks do not match board" }, { status: 400 });
  }
  const result = simulateSeason({ picks: picks as string[], seed });

  const session = await auth();
  const creatorName =
    session?.user?.name ||
    (typeof name === "string" && name.trim() ? name.trim() : "") ||
    "A challenger";

  const id = await createChallenge(seed, creatorName.slice(0, 24), picks as string[], result);
  return NextResponse.json({ id });
}
