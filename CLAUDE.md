@AGENTS.md

# Can You Go 30-0? — Project Guide for Claude

A viral, <60-second browser game for MMA/UFC fans. The player drafts a 10-fighter
roster (10 rounds, pick 1 of 3 each round), then the game simulates a 30-fight
season and tells them whether they went a perfect **30-0**. Inspired by the
psychology of 82-0.com (NBA), not its content.

**The whole product is engineered around one feeling: "I was one fight away from
perfection — run it back."** Every design and code decision should serve
replayability, shareability, and that near-miss hook. Optimize for virality and
retention over simulation realism.

---

## ⚠️ Next.js 16 — read the local docs first

This repo runs **Next.js 16.2.9** (App Router) + **React 19**. Per `AGENTS.md`,
this version has breaking changes from older Next.js. **Before writing any
Next-specific code (route handlers, `next.config`, dynamic APIs, OG image
generation, caching, params), read the relevant guide under
`node_modules/next/dist/docs/`** (`01-app`, `03-architecture`, `index.md`). Do
not assume App Router conventions from memory — verify them. The pure game engine
(`lib/game/**`) is framework-agnostic and has no such constraint.

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.2.9 (App Router) | Read local docs before Next-specific code |
| UI | React 19.2, Tailwind CSS v4 | `app/globals.css`, `@tailwindcss/postcss` |
| Language | TypeScript 5, `strict: true` | Path alias `@/*` → repo root |
| Sim engine | Pure TS, zero deps | `lib/game/**` — runs on server or client |
| Tests | Vitest 4 | `npx vitest run lib/game` |
| Database | Neon Postgres (ap-southeast-1) | Connection in `.env.local` as `DATABASE_URL` |
| Package manager | **pnpm** (10.x) | Node 25. Use `pnpm`, not npm/yarn |

### Commands
```bash
pnpm dev                     # next dev
pnpm build                   # next build
pnpm lint                    # eslint
npx vitest run lib/game      # run engine + calibration tests
npx vitest run lib/game --reporter=verbose | grep calibration   # see tuning rates
npx tsc --noEmit             # typecheck whole project
```

---

## Repository structure

```
app/                     # Next.js App Router
  layout.tsx             # Root layout: fonts, metadata, SiteHeader + SiteFooter
  page.tsx               # Home — renders the game
  globals.css            # Tailwind v4 entry
  how-it-works/page.tsx  # Static content page (rules, tiers)
  about/page.tsx         # Static content page (inspiration, data, disclaimer)
  _components/           # Shared UI (private folder — not routed): SiteHeader, SiteFooter
  _game/                 # Game client UI (private folder — not routed)
    Game.tsx             # ★ Client state machine: start → pick → sim → result
    FighterAvatar.tsx    # Photo with monogram fallback (next/image)
    helpers.ts           # Avatars, tags, share text, fighterImage() lookup
lib/game/                # ★ THE GAME ENGINE — pure, deterministic, framework-free
  types.ts               # Domain types (Fighter, Ratings, SeasonResult, ...)
  rng.ts                 # Seeded PRNG (mulberry32 + string hash)
  fighters.ts            # 49 real fighters with AUTHORED ratings (source of truth)
  fighter-images.json    # id → free-licensed photo URL (generated; see scripts/)
  board.ts               # Builds the 10-round × 3-choice board (also Daily Challenge)
  engine.ts              # OVR, schedule, fight sim, scoring, tiers, MVP, story
  engine.test.ts         # Engine unit + calibration tests
  board.test.ts          # Board validity + real-play calibration
scripts/
  fetch-fighter-images.mjs  # Re-pull fighter photos from Wikipedia (run on roster change)
.env.local               # DATABASE_URL — GITIGNORED, never commit
.env.example             # Placeholder template (committed)
```

### Fighter photos
Photos are **free-licensed, pulled from Wikipedia/Wikimedia** by
`scripts/fetch-fighter-images.mjs` into `lib/game/fighter-images.json` (46/49
resolve; the rest fall back to monogram avatars). Served via `next/image`
(`upload.wikimedia.org` is allowlisted in `next.config.ts`). **Do not hotlink
UFC's copyrighted CDN.** Re-run the script with `node scripts/fetch-fighter-images.mjs`
after editing the roster. The footer carries the "not affiliated with UFC"
disclaimer required by this choice. A personal best is stored in `localStorage`
(`cyg300:best`).

---

## The game engine (`lib/game/`) — how it works

This is the heart of the product and it is **complete and calibrated**. It is a
pure library: no Next, no DB, no I/O. Treat it as the single source of game truth.

### Core mechanic: 10 fighters → 30 fights
Each of the 10 drafted fighters fights **3 bouts** (10 × 3 = 30). The season record
is the aggregate. This is the key design decision: **one weak pick can go 0-3 and
mathematically cap you below perfection**, so the result screen's "Weakest Pick" is
always attributable to a single choice — the engine of the near-miss feeling.

### Fighter ratings (0–100)
Seven traits: `striking, grappling, cardio, durability, fightIq, experience,
finishing`. **These are AUTHORED (reputation-based), not scraped.** No public
dataset provides them (UFCStats/Kaggle/octagon-api give raw stats like SLpM/TD
avg, not "Fight IQ: 96"). Hand-tuning gives better game feel and zero ToS/legal
risk. Ratings are deliberately spread so the 3-fighter choice rounds force real
trade-offs instead of "always pick the highest OVR."

### Overall (OVR)
Weighted sum in `engine.ts` → `ovr()`. Weights favor offense + the "stay unbeaten"
traits (cardio/durability/IQ). Changing `OVR_WEIGHTS` changes which fighters feel
strong.

### Schedule & simulation
- `buildSchedule()` creates 30 bouts ramping in difficulty (opp OVR ~60 → ~90),
  with a late steepening so the last ~10 fights are the "title run" where losses
  cluster — i.e. heartbreak at fight 27/28/29.
- Round-robin assignment (`boutIndex % 10`) gives each fighter one deep title-run
  fight, so a weak pick reliably drops its hard bout.
- `simFight()`: `winProb = logistic((ovr - oppOvr + styleModifier) / SCALE)`, then
  a seeded RNG roll. `styleModifier` is a small striker/wrestler/grappler matchup
  nudge — believability + debate flavor, not a coin flip.
- `pickMethod()` derives KO/Submission/Decision (and Upset variants) for flavor.

### ★ The one knob that matters: `SCALE` (in `engine.ts`)
`SCALE` controls variance. **Lower = more deterministic** (favorites always win,
near-misses come only from weak picks). **Higher = more upsets.** It is the single
constant that decides how often a strong roster goes 30-0. **Currently `SCALE =
4.2`**, which produces (measured by the calibration tests):

| Player behavior | 30-0 rate | 29-1 rate |
|---|---|---|
| Skilled (always picks best of the 3) | **~4.5%** | ~14.6% |
| Clueless (random picks) | ~0.3% | — |

This is the target zone: perfection is rare enough to chase, near-misses are ~3×
more common than perfection (the hook). **If you change `SCALE`, the OVR weights,
fighter ratings, or the opponent curve, re-run the calibration tests and keep the
skilled-player 30-0 rate roughly in the 3–8% band with 29-1 strictly more common
than 30-0.** Do not let it drift to "everyone hits 30-0" (no chase) or "nobody
does" (hopeless).

### Determinism (critical — do not break)
Everything is seeded:
- **Board** is derived from a string seed → same seed = identical board. This is
  what makes the **Daily Challenge** the same for everyone.
- **Season** is seeded from a sim seed → reproducible result. This is what lets a
  **share link / OG image always reproduce the exact season the player saw.**

`Date.now()` / `Math.random()` are **banned in `lib/game/**`** — they would break
reproducibility. Pass seeds/timestamps in from the caller.

### Result payload (`SeasonResult`)
`record`, `goatScore` (0–100), `tier` (IMMORTAL / HALL OF FAMER / CHAMPION /
CONTENDER / JOURNEYMAN / GATEKEEPER), `mvpFighterId`, `weakestFighterId`,
per-fighter breakdown, all 30 fights, and a generated `story` that names the
specific fight you lost and why ("Fight 29: X gassed in the championship rounds").
The story is template-based string assembly — no LLM needed.

### Extending the fighter pool
Edit `lib/game/fighters.ts`. Keep ids stable (they're stored in `runs.picks`).
Pool must hold ≥ 30 fighters (10 rounds × 3). To scale to 200+ later, write a
mapper from real UFCStats/octagon-api raw stats → the 7 ratings (not built yet).
**Do not add photo URLs** (see Security).

---

## Database (Neon Postgres)

- Connection string lives in `.env.local` as `DATABASE_URL` (pooled, `-pooler`
  host). **Never** hardcode it or write it into committed files, code, logs, or
  this doc.
- Recommended client: **`@neondatabase/serverless`** (works in both Node and Edge
  route handlers, plays well with Neon pooling). `pg` also works for Node-only.
  Neither is installed yet — `pnpm add @neondatabase/serverless` when building the
  data layer.
- The **canonical fighter data is in code** (`fighters.ts`), not the DB. The DB
  stores plays, daily boards, and leaderboard data only.
- **The simulation must be server-authoritative**: the client sends `picks[]`, the
  server runs `simulateSeason()` and stores the result. Never trust a
  client-submitted record, or the leaderboard is trivially faked.

### Schema (APPLIED — `scripts/db-setup.mjs`, idempotent)
Two tables: **`runs`** (every completed season, keyed by `player_key` =
`google:<email>` or `guest:<uuid>`) and **`challenges`** (head-to-head links).
Queries live in `lib/queries.ts`. Re-apply with
`node --env-file=.env.local scripts/db-setup.mjs`. The fighter pool stays in code
(`fighters.ts`); the DB only stores plays + challenges.

Leaderboard = **best-per-player** (`DISTINCT ON (player_key)`), ranked by `wins`
then `goat_score` — so even 30-0 teams are ordered by GOAT score (82-0 style).

## Auth & identity

- **Auth.js v5** (`next-auth@beta`) in `auth.ts` (root), JWT sessions, handler at
  `app/api/auth/[...nextauth]/route.ts`. Server components read the session with
  `await auth()`; sign-in/out use server actions in `SiteHeader`.
- **Google is optional.** The provider only loads when `AUTH_GOOGLE_ID` is set
  (`googleEnabled` in `auth.ts`), so the app runs in **nickname-only mode** until
  you add credentials. Guests get a `localStorage` `guestId` + a typed nickname.
- **Server-authoritative scoring.** `POST /api/run` re-validates picks against
  `buildBoard(seed)` and re-runs `simulateSeason` server-side before saving —
  the client result is for instant display only; the DB never trusts it.

### Enabling Google sign-in (your setup — ~10 min)
1. Google Cloud Console → APIs & Services → **Credentials** → Create **OAuth client
   ID** → *Web application*.
2. Authorized redirect URI (dev): `http://localhost:3000/api/auth/callback/google`
   (add your prod URL too when you deploy).
3. Put the values in `.env.local`:
   `AUTH_GOOGLE_ID=...` and `AUTH_GOOGLE_SECRET=...` (uncomment the lines already
   there). `AUTH_SECRET` is already generated.
4. Restart `pnpm dev`. The "Sign in" button appears automatically.

## Environment variables (`.env.local`, gitignored)
| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Neon Postgres (pooled) |
| `AUTH_SECRET` | yes | Auth.js JWT signing (already generated) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | optional | Enables Google sign-in |

---

## Conventions

- **TypeScript strict.** No `any` in committed code (tests may use small casts).
- **`lib/game/**` stays pure** — no imports from `app/`, no Next, no DB, no
  `Date.now()`/`Math.random()`. If you need randomness or time, take a seed.
- Path alias `@/*` maps to repo root (e.g. `import { simulateSeason } from
  "@/lib/game/engine"`).
- Match existing file style; keep modules small and single-purpose.
- Every engine change ships with a passing `npx vitest run lib/game`.

---

## Security & IP (read before touching data or marketing)

- **Never commit secrets.** `DATABASE_URL` and any keys live only in `.env.local`
  (gitignored). Use Neon env vars / a secrets manager in deployment — never
  hardcode. Flag any secret found in client bundles, logs, or git history.
- **Fighter photos = Wikimedia only.** We use free-licensed Wikipedia photos
  (with monogram fallback) and a footer disclaimer. **Never** hotlink UFC's
  copyrighted CDN. See the "Fighter photos" section above.
- **Likeness/names are a legal gray area.** The game uses real fighter names
  (like 82-0 uses NBA names). Get the names+likeness question in front of legal
  review before any paid marketing or monetization.
- Never put real credentials, tokens, or PII in code examples — use clearly fake
  placeholders.

---

## Product decisions already made (don't re-litigate)

These were decided during design; reopen only with a specific reason.
- **3 bouts per fighter** (not an opaque team sim) — makes the near-miss
  attributable to one pick. Keep it.
- **Daily Challenge is the #1 retention/virality feature**, above a global
  all-time leaderboard. Build it early. Use percentile, not rank.
- **Share artifact must be a rendered image card** (OG image / canvas), not text.
  No image = no spread.
- **No achievements / no Prime fighters in v1.** Primes are a cheap v1.1 add (a
  ~3% `isPrime` boosted card — field already exists on `Fighter`).
- **Photos = Wikimedia free-licensed** (with monogram fallback), not UFC CDN.

## Build order / roadmap

1. ✅ **Engine** — pure TS sim + calibration tests. *(`lib/game/`)*
2. ✅ **Playable loop UI** — start → pick → simulate → result. *(`app/_game/`)*
3. ✅ **Header/footer + content pages + real fighter photos.**
4. ✅ **Data layer** — Neon client, `runs`/`challenges` schema, server-authoritative
   `POST /api/run`.
5. ✅ **Auth** — Auth.js Google sign-in (optional) + nickname fallback.
6. ✅ **Global leaderboard** — `/leaderboard`, best-per-player, GOAT tiebreak.
7. ✅ **Head-to-head challenge links** — `/challenge/[id]`, replay same board, compare.
8. **Shareable OG image card** — the growth engine. Sharing currently copies
   text / Web Share API; replace with a rendered `/share/[runId]` image.
9. **Daily Challenge** — one deterministic board per day (`daily_boards`), daily
   leaderboard / percentile. (Global board already done.)
10. *(v1.1)* Prime fighters, streaks, larger roster via stats→ratings mapper.

When in doubt, ask: *does this make the "one fight away, run it back" loop tighter
or more shareable?* If not, it can probably wait.
