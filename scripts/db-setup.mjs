// Apply the database schema to Neon. Idempotent (IF NOT EXISTS).
// Run: node --env-file=.env.local scripts/db-setup.mjs

import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set. Run with: node --env-file=.env.local scripts/db-setup.mjs");
  process.exit(1);
}
const sql = neon(url);

const statements = [
  `CREATE TABLE IF NOT EXISTS runs (
     id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     player_key         TEXT NOT NULL,
     player_name        TEXT NOT NULL,
     player_image       TEXT,
     player_source      TEXT NOT NULL CHECK (player_source IN ('google','guest')),
     mode               TEXT NOT NULL DEFAULT 'endless',
     seed               TEXT NOT NULL,
     picks              JSONB NOT NULL,
     wins               SMALLINT NOT NULL,
     losses             SMALLINT NOT NULL,
     goat_score         SMALLINT NOT NULL,
     tier               TEXT NOT NULL,
     mvp_fighter_id     TEXT NOT NULL,
     weakest_fighter_id TEXT NOT NULL,
     created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  // game discriminator: '30-0' (default) or 'goat'. Lets runs/challenges/leaderboard
  // be shared across both games (see CLAUDE.md). Added via ALTER so it's idempotent
  // on an already-applied schema.
  `ALTER TABLE runs ADD COLUMN IF NOT EXISTS game TEXT NOT NULL DEFAULT '30-0'`,
  `CREATE INDEX IF NOT EXISTS idx_runs_leaderboard
     ON runs (wins DESC, goat_score DESC, created_at ASC)`,
  `CREATE INDEX IF NOT EXISTS idx_runs_game_leaderboard
     ON runs (game, wins DESC, goat_score DESC, created_at ASC)`,
  `CREATE INDEX IF NOT EXISTS idx_runs_player ON runs (player_key)`,
  `CREATE TABLE IF NOT EXISTS challenges (
     id              TEXT PRIMARY KEY,
     seed            TEXT NOT NULL,
     creator_name    TEXT NOT NULL,
     creator_picks   JSONB NOT NULL,
     creator_wins    SMALLINT NOT NULL,
     creator_losses  SMALLINT NOT NULL,
     creator_goat    SMALLINT NOT NULL,
     created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `ALTER TABLE challenges ADD COLUMN IF NOT EXISTS game TEXT NOT NULL DEFAULT '30-0'`,
  // Cache of generated GOAT fighter portraits, keyed by the build (7 picks),
  // so identical builds don't re-call the paid image API.
  `CREATE TABLE IF NOT EXISTS goat_portraits (
     build_key   TEXT PRIMARY KEY,
     image       TEXT NOT NULL,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  // Email/password accounts (Auth.js Credentials provider). Google users are
  // NOT stored here — they live only in the JWT. Passwords are bcrypt hashes.
  `CREATE TABLE IF NOT EXISTS users (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email         TEXT UNIQUE NOT NULL,
     password_hash TEXT NOT NULL,
     name          TEXT,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  // Email-authed players are a new leaderboard source ('email'); the old CHECK
  // only allowed google/guest, so drop it (player_source stays free-text).
  `ALTER TABLE runs DROP CONSTRAINT IF EXISTS runs_player_source_check`,
];

for (const stmt of statements) {
  await sql.query(stmt);
  console.log("✓", stmt.split("\n")[0].replace("CREATE ", "").trim());
}
console.log("\nSchema applied.");
