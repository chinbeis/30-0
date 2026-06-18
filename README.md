# 🥊 MMA Browser Games

Two fast, replayable, shareable MMA games inspired by the psychology of
[82-0.com](https://82-0.com) — built to be played in under 60 seconds and argued
about for much longer.

| Game | Route | The hook |
|------|-------|----------|
| **Can You Go 30-0?** | `/` | Draft 10 fighters (10 rounds × 3 choices). Each fighter takes 3 of a 30-fight season. Go a perfect **30-0** — or find out which pick cost you. |
| **Can You Become the GOAT?** | `/goat` | Build ONE fighter by stealing a trait from a legend in each of 7 categories, then run a 13-fight gauntlet to **triple champ**. 3 rerolls for the whole draft. |

Both games share the same engine philosophy: a deterministic, seeded simulation
tuned so that **near-misses are far more common than perfection** — the "one more
run" loop.

---

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4**
- **Neon Postgres** (`@neondatabase/serverless`) — leaderboard, challenges, portrait cache
- **Auth.js v5** (`next-auth`) — optional Google sign-in + nickname fallback
- **OpenAI gpt-image-1** — optional AI fighter caricatures
- **Vitest** — engine + calibration tests
- **pnpm**

The game engines under `lib/game/` and `lib/goat/` are **pure, deterministic, and
framework-free** (no Next, no DB, no `Date.now`/`Math.random` — everything is
seeded), so they're fully unit-testable.

---

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in DATABASE_URL (see below)
pnpm dev                     # http://localhost:3000
```

Everything works with **only** a database configured. Google sign-in and AI
portraits are optional — the app degrades gracefully without them (nickname play,
default fighter card).

### Database setup

```bash
node --env-file=.env.local scripts/db-setup.mjs   # idempotent; creates tables
```

### Environment variables (`.env.local`, gitignored)

| Var | Required | Purpose |
|-----|----------|---------|
| `DATABASE_URL` | **yes** | Neon Postgres pooled connection string |
| `AUTH_SECRET` | yes | Auth.js session signing (`npx auth secret` or `openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | optional | Enables "Sign in with Google" |
| `OPENAI_API_KEY` | optional | Enables the GOAT AI fighter caricature |

**Never commit `.env.local` or paste secrets into code/PRs.** In deployment, set
these as host environment variables or via a secrets manager.

#### Enabling Google sign-in
Create an OAuth client at the
[Google Cloud Console](https://console.cloud.google.com/apis/credentials) (Web
application). Authorized redirect URI for dev:
`http://localhost:3000/api/auth/callback/google`. Add the id/secret to
`.env.local` and restart. Without it, players save scores under a nickname.

---

## Scripts

```bash
pnpm dev                          # dev server
pnpm build                        # production build
pnpm start                        # serve the production build
pnpm lint                         # eslint
npx vitest run                    # run all engine + calibration tests
npx vitest run lib/goat --reporter=verbose | grep "\[goat\]"   # see GOAT tuning rates
node scripts/fetch-fighter-images.mjs              # refresh fighter photos
node --env-file=.env.local scripts/db-setup.mjs    # apply DB schema
```

---

## Project structure

```
app/
  page.tsx                 # 30-0 game
  goat/                    # GOAT game (+ _game/Build.tsx client UI)
  leaderboard/             # global leaderboard
  challenge/[id]/          # head-to-head "beat my team" (30-0)
  api/                     # run, leaderboard, challenge, goat/portrait, auth
  _components/             # SiteHeader, SiteFooter, AuthControls (login modal)
  _game/                   # 30-0 client UI + FighterAvatar
lib/
  game/                    # 30-0 engine (pure) + fighter rosters + photos
  goat/                    # GOAT engine (pure)
  db.ts, queries.ts        # Neon access
scripts/                   # db setup, image fetch
auth.ts                    # Auth.js config
```

---

## Fighter data & photos

- **Rosters** live in code: `lib/game/fighters.ts` (legends + current UFC top-10),
  `fighters-current.ts`, and `fighters-extended.ts` (mid/low tier, GOAT only).
  The seven 0–100 ratings are **authored/editorial** (reputation-based), not
  official stats — disagreeing with them is half the fun.
- **Photos** are free-licensed from Wikipedia/Wikimedia (with monogram fallback),
  served via `next/image`. Refresh with `node scripts/fetch-fighter-images.mjs`.

---

## Disclaimer

Unofficial fan project. **Not affiliated with, endorsed by, or sponsored by the
UFC, Zuffa, or any athlete.** Fighter names and likenesses belong to their
respective owners; photos are sourced from Wikimedia Commons under their
respective licenses. AI-generated images are comedic caricatures derived from
gameplay choices.
