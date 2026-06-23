import { sql } from "./db";

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Seconds until the window resets (for Retry-After). */
  retryAfter: number;
}

/**
 * Atomic fixed-window rate limit backed by Postgres (works across serverless
 * instances, unlike in-memory counters). One row per bucket; the window resets
 * lazily once reset_at passes. Fails OPEN on DB error so a hiccup can't lock
 * everyone out — except where the caller treats it as a hard cost cap.
 */
export async function rateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  try {
    const rows = (await sql`
      INSERT INTO rate_limits (bucket, count, reset_at)
      VALUES (${bucket}, 1, now() + (${windowSeconds} || ' seconds')::interval)
      ON CONFLICT (bucket) DO UPDATE SET
        count = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
        reset_at = CASE WHEN rate_limits.reset_at < now()
                        THEN now() + (${windowSeconds} || ' seconds')::interval
                        ELSE rate_limits.reset_at END
      RETURNING count, EXTRACT(EPOCH FROM (reset_at - now()))::int AS retry_after
    `) as { count: number; retry_after: number }[];
    const count = rows[0]?.count ?? 1;
    const retryAfter = Math.max(1, rows[0]?.retry_after ?? windowSeconds);
    return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfter };
  } catch {
    // DB unavailable: don't block normal traffic.
    return { ok: true, remaining: limit, retryAfter: 0 };
  }
}

/** Best-effort client IP from Vercel/proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/** 429 JSON response with a Retry-After header. */
export function tooMany(retryAfter: number): Response {
  return new Response(JSON.stringify({ error: "rate_limited", retryAfter }), {
    status: 429,
    headers: { "content-type": "application/json", "retry-after": String(retryAfter) },
  });
}
