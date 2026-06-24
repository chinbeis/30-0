// One-off: download the already-resolved free-licensed photos from Wikimedia
// into public/fighters/ and repoint lib/game/fighter-images.json at the local
// copies. We self-host (instead of hotlinking upload.wikimedia.org via next/image)
// so a viral spike can't get us 429-rate-limited by Wikimedia, and so Vercel's
// CDN serves the optimized images. License attribution stays in the JSON
// (remoteSrc + pageUrl + title). Re-run after fetch-fighter-images.mjs adds more.
//
// Run: node scripts/download-fighter-images.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const jsonPath = join(root, "lib/game/fighter-images.json");
const outDir = join(root, "public/fighters");
mkdirSync(outDir, { recursive: true });

const UA = "CanYouGo30-0/0.1 (self-hosting free-licensed Commons photos; contact dev)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      if (res.status === 429 || res.status >= 500) {
        await sleep(1500 * (attempt + 1)); // back off on throttle / transient
        continue;
      }
      return null; // 404 etc — give up
    } catch {
      await sleep(800 * (attempt + 1));
    }
  }
  return null;
}

const data = JSON.parse(readFileSync(jsonPath, "utf8"));
let saved = 0;
let skipped = 0;
const failed = [];

const persist = () => writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n");
const existsLocal = (id) =>
  ["jpg", "png", "gif", "webp"].some((e) => existsSync(join(outDir, `${id}.${e}`)));

// Reconcile orphans first: a prior run (or a kill mid-write) may have left a file
// on disk while the JSON still points remote. Repoint those for free.
for (const [id, entry] of Object.entries(data)) {
  if (entry.src?.startsWith("https") && existsLocal(id)) {
    const e = ["jpg", "png", "gif", "webp"].find((x) => existsSync(join(outDir, `${id}.${x}`)));
    if (!entry.remoteSrc) entry.remoteSrc = entry.src;
    entry.src = `/fighters/${id}.${e}`;
  }
}
persist();

for (const [id, entry] of Object.entries(data)) {
  const src = entry.src;
  if (!src || src.startsWith("/")) {
    skipped++; // already self-hosted
    continue;
  }
  const ext = (src.match(/\.(jpe?g|png|gif|webp)(?:$|\?)/i)?.[1] ?? "jpg").toLowerCase();
  const buf = await download(src);
  if (!buf) {
    failed.push({ id, name: entry.title ?? id, remoteSrc: src });
    continue;
  }
  const file = `${id}.${ext === "jpeg" ? "jpg" : ext}`;
  writeFileSync(join(outDir, file), buf);
  if (!entry.remoteSrc) entry.remoteSrc = src; // preserve original for re-download/attribution
  entry.src = `/fighters/${file}`;
  saved++;
  persist(); // write after EVERY success so a kill never loses progress
  await sleep(700); // be polite — slower-but-steady avoids Wikimedia's 429 throttle
}

persist();

// Record what we couldn't pull (Wikimedia 429/404) so it's easy to retry later.
const skipPath = join(root, "tmp", "skipped-fighter-images.json");
mkdirSync(join(root, "tmp"), { recursive: true });
writeFileSync(
  skipPath,
  JSON.stringify({ generatedAt: new Date().toISOString(), count: failed.length, failed }, null, 2) + "\n",
);

console.log(`Saved ${saved}, skipped ${skipped} (already local), failed ${failed.length}.`);
if (failed.length) {
  console.log("Failed (kept remote):", failed.map((f) => f.id).join(", "));
  console.log(`Skip list written to tmp/skipped-fighter-images.json`);
}
