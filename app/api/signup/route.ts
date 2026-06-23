import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser } from "@/lib/queries";
import { clientIp, rateLimit, tooMany } from "@/lib/ratelimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  // Tight cap: signups are rare and a prime abuse/cost target.
  const rl = await rateLimit(`signup:${clientIp(req)}`, 5, 3600);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const { email, password, name } = (body ?? {}) as Record<string, unknown>;

  const cleanEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
  const pass = typeof password === "string" ? password : "";

  if (!EMAIL_RE.test(cleanEmail)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (pass.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const hash = await bcrypt.hash(pass, 10);
  const displayName =
    typeof name === "string" && name.trim() ? name.trim().slice(0, 24) : cleanEmail.split("@")[0];

  const user = await createUser(cleanEmail, hash, displayName).catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }
  // Never return the hash. Client will call signIn('credentials') next.
  return NextResponse.json({ ok: true, email: user.email });
}
