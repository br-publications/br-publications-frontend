// Pings IndexNow (Bing, Yandex, Seznam, Naver...) with new/changed sitemap URLs.
// Usage:  node scripts/indexnow.mjs            -> submit only URLs whose lastmod changed since last run
//         node scripts/indexnow.mjs --all      -> submit every URL
//         node scripts/indexnow.mjs --dry      -> print what would be sent
import fs from 'node:fs';

const HOST = 'www.brpublications.com';
const KEY = process.env.INDEXNOW_KEY || '942a862d1c0c506cdbc4c1f57ee1ccc3';
const SITEMAP = process.env.SITEMAP_URL || `https://${HOST}/sitemap.xml`;
const STATE_FILE = new URL('./.indexnow-state.json', import.meta.url);
const args = process.argv.slice(2);
const ALL = args.includes('--all');
const DRY = args.includes('--dry');
// --since=N : stateless mode (for CI) -> submit URLs whose lastmod is within the last N days
const SINCE = Number((args.find((a) => a.startsWith('--since=')) || '').split('=')[1] || 0);

const xml = await (await fetch(SITEMAP)).text();
const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
  loc: m[1].match(/<loc>(.*?)<\/loc>/)?.[1]?.replace(/&amp;/g, '&'),
  lastmod: m[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1] ?? '',
})).filter((e) => e.loc);

let state = {};
try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}

// First run only records the baseline (avoids blasting every URL), unless --all.
const firstRun = !SINCE && Object.keys(state).length === 0;
const changed = entries.filter((e) => ALL
  || (SINCE ? e.lastmod && Date.now() - new Date(e.lastmod) < SINCE * 864e5
            : !firstRun && state[e.loc] !== e.lastmod));
const next = Object.fromEntries(entries.map((e) => [e.loc, e.lastmod]));

console.log(`${entries.length} URLs in sitemap, ${changed.length} to submit${firstRun && !ALL ? ' (first run: baseline saved)' : ''}`);
if (DRY) { changed.forEach((e) => console.log(' ', e.loc)); process.exit(0); }

for (let i = 0; i < changed.length; i += 10000) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: changed.slice(i, i + 10000).map((e) => e.loc),
    }),
  });
  console.log(`IndexNow batch ${i / 10000 + 1}: HTTP ${res.status}`); // 200/202 = accepted
  if (res.status >= 400) process.exit(1);
}
if (!SINCE) fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 1));
