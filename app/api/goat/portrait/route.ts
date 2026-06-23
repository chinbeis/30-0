import { NextResponse } from "next/server";
import { hashSeed } from "@/lib/game/rng";
import { getPoolFighter } from "@/lib/goat/engine";
import { buildPortraitPrompt } from "@/lib/goat/portrait";
import { getPortrait, savePortrait } from "@/lib/queries";
import { clientIp, rateLimit, tooMany } from "@/lib/ratelimit";

export const maxDuration = 60; // image generation can take a while

const PICKS = 7;

// Cost guardrails for the paid OpenAI image API. Tune via env without a redeploy.
const PORTRAIT_PER_IP_PER_HOUR = Number(process.env.PORTRAIT_PER_IP_PER_HOUR ?? 10);
const PORTRAIT_GLOBAL_PER_DAY = Number(process.env.PORTRAIT_GLOBAL_PER_DAY ?? 500);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const { picks } = (body ?? {}) as Record<string, unknown>;

  if (!Array.isArray(picks) || picks.length !== PICKS || picks.some((p) => typeof p !== "string")) {
    return NextResponse.json({ error: "invalid build" }, { status: 400 });
  }
  // ensure every id resolves to a real fighter (and build the prompt)
  let prompt: string;
  try {
    (picks as string[]).forEach((id) => getPoolFighter(id));
    prompt = buildPortraitPrompt(picks as string[]);
  } catch {
    return NextResponse.json({ error: "unknown fighter" }, { status: 400 });
  }

  const buildKey = String(hashSeed((picks as string[]).join(",")));

  // serve from cache if we've generated this exact build before (cost control)
  try {
    const cached = await getPortrait(buildKey);
    if (cached) return NextResponse.json({ image: cached, cached: true });
  } catch {
    /* cache miss / DB hiccup — fall through to generate */
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  // Cost guardrails (only reached on a cache MISS that would actually bill us):
  // per-IP burst limit, then a hard global daily cap to bound spend during a spike.
  const ipLimit = await rateLimit(`portrait:ip:${clientIp(req)}`, PORTRAIT_PER_IP_PER_HOUR, 3600);
  if (!ipLimit.ok) return tooMany(ipLimit.retryAfter);
  const dayLimit = await rateLimit("portrait:global:day", PORTRAIT_GLOBAL_PER_DAY, 86400);
  if (!dayLimit.ok) {
    return NextResponse.json({ error: "busy" }, { status: 503 });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        quality: "low",
        n: 1,
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("openai image error", res.status, detail.slice(0, 300));
      return NextResponse.json({ error: "generation_failed" }, { status: 502 });
    }
    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return NextResponse.json({ error: "generation_failed" }, { status: 502 });

    const image = `data:image/png;base64,${b64}`;
    savePortrait(buildKey, image).catch(() => {}); // cache best-effort, don't block
    return NextResponse.json({ image, cached: false });
  } catch {
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }
}
