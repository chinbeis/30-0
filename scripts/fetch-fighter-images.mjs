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

// Pull the id/name list straight out of fighters.ts without importing TS.
const src = readFileSync(join(root, "lib/game/fighters.ts"), "utf8");
const re = /id:\s*"([^"]+)",\s*name:\s*"([^"]+)"/g;
const fighters = [];
for (const m of src.matchAll(re)) fighters.push({ id: m[1], name: m[2] });

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

const out = {};
let ok = 0;
const misses = [];

for (const f of fighters) {
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

writeFileSync(
  join(root, "lib/game/fighter-images.json"),
  JSON.stringify(out, null, 2) + "\n",
);

console.log(`\nResolved ${ok}/${fighters.length} fighter photos.`);
if (misses.length) console.log("No clean photo (will use monogram):", misses.join(", "));
