import { neon } from "@neondatabase/serverless";

// Neon serverless HTTP client — safe in route handlers (Node & Edge).
// DATABASE_URL lives in .env.local (gitignored). Never hardcode it.
if (!process.env.DATABASE_URL) {
  // Don't throw at import time in the browser bundle; only server code uses this.
  // Route handlers will surface a clear error if the env var is missing.
}

export const sql = neon(process.env.DATABASE_URL ?? "");
