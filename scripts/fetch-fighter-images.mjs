// One-off author-time script: pull free-licensed fighter photos from Wikipedia's
// REST summary API and bake the URLs into lib/game/fighter-images.json.
// Run: node scripts/fetch-fighter-images.mjs
// Re-run anytime the roster changes. Missing/disambiguated fighters just fall
// back to the monogram avatar in the UI.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Pull the id/name list straight out of the fighter files without importing TS.
const re = /id:\s*"([^"]+)",\s*name:\s*"([^"]+)"/g;
const fighters = [];
for (const file of [
  "lib/game/fighters.ts",
  "lib/game/fighters-extended.ts",
  "lib/game/fighters-current.ts",
]) {
  const src = readFileSync(join(root, file), "utf8");
  for (const m of src.matchAll(re)) fighters.push({ id: m[1], name: m[2] });
}

// Preserve already-resolved photos; only fetch ids we don't have yet.
const outPath = join(root, "lib/game/fighter-images.json");
let existing = {};
try {
  existing = JSON.parse(readFileSync(outPath, "utf8"));
} catch {
  /* first run */
}

// Explicit Wikipedia titles for names that disambiguate to the wrong person.
const TITLE_OVERRIDES = {
  "Leon Edwards": "Leon Edwards (fighter)",
  "Robert Whittaker": "Robert Whittaker (fighter)",
  "Sean O'Malley": "Sean O'Malley (fighter)",
  "TJ Dillashaw": "T.J. Dillashaw",
  "Demetrious Johnson": "Demetrious Johnson (fighter)",
  "Valentina Shevchenko": "Valentina Shevchenko (fighter)",
  "Tony Ferguson": "Tony Ferguson (fighter)",
  "Jose Aldo": "José Aldo",
  "Mauricio Rua": "Maurício Rua",
  "Stipe Miocic": "Stipe Miočić",
  "Fabricio Werdum": "Fabrício Werdum",
  "Cain Velasquez": "Cain Velasquez",
  // current roster disambiguations
  "Sean Brady": "Sean Brady (fighter)",
  "Michael Morales": "Michael Morales (fighter)",
  "Anthony Hernandez": "Anthony Hernandez (fighter)",
  "Jean Silva": "Jean Silva (fighter)",
  "Diego Lopes": "Diego Lopes (fighter)",
  "Alex Perez": "Alex Perez (fighter)",
  "Brandon Royval": "Brandon Royval",
  "Song Yadong": "Song Yadong",
  "Jared Cannonier": "Jared Cannonier",
};

const UA = "CanYouGo30-0/0.1 (educational game prototype; contact dev)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchSummary(title) {
  const url =
    "https://en.wikipedia.org/api/rest_v1/page/summary/" +
    encodeURIComponent(title.replace(/ /g, "_"));
  // The REST API throws transient "Internal error" responses — retry with backoff.
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const img = data?.thumbnail?.source ?? data?.originalimage?.source;
        if (img || data?.type === "disambiguation") return data; // definitive
      }
    } catch {
      /* retry */
    }
    await sleep(400 * (attempt + 1));
  }
  return null;
}

const out = { ...existing };
let ok = 0;
const misses = [];

for (const f of fighters) {
  if (out[f.id]) continue; // already resolved on a previous run
  const title = TITLE_OVERRIDES[f.name] ?? f.name;
  try {
    const data = await fetchSummary(title);
    const img = data?.thumbnail?.source ?? data?.originalimage?.source;
    if (data?.type === "disambiguation" || !img) {
      misses.push(f.name);
      continue;
    }
    out[f.id] = {
      src: img,
      pageUrl: data.content_urls?.desktop?.page ?? null,
      title: data.title,
    };
    ok++;
  } catch {
    misses.push(f.name);
  }
  // be polite to the API
  await new Promise((r) => setTimeout(r, 120));
}

writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");

console.log(
  `\nNewly resolved ${ok} photos. Total ${Object.keys(out).length}/${fighters.length}.`,
);
if (misses.length) console.log("No clean photo (will use monogram):", misses.join(", "));
