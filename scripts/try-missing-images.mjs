// Second-chance image hunt for fighters with no photo yet. The REST summary API
// only returns an article's (often non-free) lead image; this instead:
//   1) tries Wikidata P18 (the entity's official Commons image), then
//   2) searches Wikimedia Commons directly for free-licensed photos whose
//      filename matches the fighter's name.
// Confident matches are downloaded into public/fighters/ and baked into the JSON.
// Every pick is logged to tmp/recovered-images.json so you can eyeball them.
//
// Run: node scripts/try-missing-images.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const jsonPath = join(root, "lib/game/fighter-images.json");
const missingPath = join(root, "fighters-without-image.json");
const outDir = join(root, "public/fighters");

const UA = "CanYouGo30-0/0.1 (free-licensed Commons photo lookup; contact dev)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJSON(url) {
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, accept: "application/json" } });
      if (r.ok) return r.json();
      if (r.status === 429 || r.status >= 500) await sleep(1200 * (a + 1));
      else return null;
    } catch {
      await sleep(600 * (a + 1));
    }
  }
  return null;
}
async function getBuf(url) {
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.ok) return Buffer.from(await r.arrayBuffer());
      if (r.status === 429 || r.status >= 500) await sleep(1200 * (a + 1));
      else return null;
    } catch {
      await sleep(600 * (a + 1));
    }
  }
  return null;
}

const norm = (s) => s.toLowerCase().replace(/[._-]+/g, " ");
const commonsThumb = (file) =>
  "https://commons.wikimedia.org/wiki/Special:FilePath/" +
  encodeURIComponent(file.replace(/^File:/, "").replace(/ /g, "_")) +
  "?width=400";

// Wikidata P18 for an English Wikipedia title (resolves redirects).
async function wikidataImage(title) {
  const pp = await getJSON(
    `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&redirects=1&format=json&titles=${encodeURIComponent(title)}`,
  );
  const page = Object.values(pp?.query?.pages ?? {})[0];
  const qid = page?.pageprops?.wikibase_item;
  if (!qid) return null;
  const wd = await getJSON(
    `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${qid}&property=P18&format=json`,
  );
  const file = wd?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  return file ? `File:${file}` : null;
}

// Commons File-namespace search; pick the first jpg/png whose name contains the
// fighter's last name (cheap relevance guard against wrong-person matches).
async function commonsSearch(name) {
  const last = name.split(/\s+/).pop().toLowerCase();
  const data = await getJSON(
    `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=15&format=json&srsearch=${encodeURIComponent(
      name + " mixed martial artist",
    )}`,
  );
  const hits = data?.query?.search ?? [];
  for (const h of hits) {
    const t = h.title;
    if (!/\.(jpe?g|png)$/i.test(t)) continue;
    if (norm(t).includes(last)) return t;
  }
  return null;
}

const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const missing = JSON.parse(readFileSync(missingPath, "utf8")).fighters;

const recovered = [];
const stillMissing = [];

for (const f of missing) {
  const title = `${f.name} (fighter)`;
  let file = await wikidataImage(f.name) || (await wikidataImage(title));
  let source = file ? "wikidata-P18" : null;
  if (!file) {
    file = await commonsSearch(f.name);
    source = file ? "commons-search" : null;
  }
  if (!file) {
    stillMissing.push(f.id);
    console.log(`❌ ${f.id.padEnd(14)} ${f.name}`);
    continue;
  }
  const url = commonsThumb(file);
  const buf = await getBuf(url);
  if (!buf) {
    stillMissing.push(f.id);
    console.log(`⚠️  ${f.id.padEnd(14)} ${f.name} — found ${file} but download failed`);
    continue;
  }
  const ext = /\.png$/i.test(file) ? "png" : "jpg";
  const local = `${f.id}.${ext}`;
  writeFileSync(join(outDir, local), buf);
  const pageUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(file.replace(/ /g, "_"))}`;
  data[f.id] = { src: `/fighters/${local}`, pageUrl, title: f.name, remoteSrc: url, via: source };
  writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n"); // persist each
  recovered.push({ id: f.id, name: f.name, source, file });
  console.log(`✅ ${f.id.padEnd(14)} ${f.name}  [${source}]  ${file}`);
  await sleep(400);
}

writeFileSync(
  join(root, "tmp", "recovered-images.json"),
  JSON.stringify({ recovered, stillMissing }, null, 2) + "\n",
);
console.log(`\nRecovered ${recovered.length}, still missing ${stillMissing.length}.`);
console.log("Review picks in tmp/recovered-images.json (verify they're the right person!).");
