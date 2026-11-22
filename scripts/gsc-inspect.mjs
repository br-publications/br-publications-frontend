// Reports index status of sitemap URLs via the Search Console URL Inspection API.
// (Read-only: Google offers no API for "Request indexing" on normal pages.)
// Usage: GSC_KEY_FILE=path/to/service-account.json node scripts/gsc-inspect.mjs [--limit=200] [--recent=14]
//   --recent=N  only inspect URLs whose sitemap lastmod is within N days (or has none)
import fs from 'node:fs';
import crypto from 'node:crypto';

const SITE = process.env.GSC_SITE || 'sc-domain:brpublications.com'; // or 'https://www.brpublications.com/'
const SITEMAP = process.env.SITEMAP_URL || 'https://www.brpublications.com/sitemap.xml';
const KEY_FILE = process.env.GSC_KEY_FILE;
const arg = (n, d) => Number((process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1] ?? d);
const LIMIT = arg('limit', 200); // API quota: 2000/day/property
const RECENT = arg('recent', 0);

if (!KEY_FILE) { console.error('Set GSC_KEY_FILE to your service-account JSON path'); process.exit(1); }
const sa = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));

const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
async function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const body = b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = crypto.sign('RSA-SHA256', Buffer.from(`${head}.${body}`), sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${body}.${sig}` }) });
  return (await r.json()).access_token;
}

const xml = await (await fetch(SITEMAP)).text();
let urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
  loc: m[1].match(/<loc>(.*?)<\/loc>/)?.[1], lastmod: m[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1] }));
if (RECENT) urls = urls.filter((u) => !u.lastmod || Date.now() - new Date(u.lastmod) < RECENT * 864e5);
urls = urls.slice(0, LIMIT);

const t = await token();
const rows = [['url', 'verdict', 'coverage', 'lastCrawl']];
for (const u of urls) {
  const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', { method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: u.loc, siteUrl: SITE }) });
  const j = await r.json();
  const s = j.inspectionResult?.indexStatusResult;
  if (!s) { console.error(u.loc, j.error?.message); if (r.status === 429) break; continue; }
  rows.push([u.loc, s.verdict, s.coverageState, s.lastCrawlTime || '']);
  console.log(`${s.verdict.padEnd(8)} ${s.coverageState} — ${u.loc}`);
}
fs.writeFileSync('gsc-index-report.csv', rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));
console.log('Saved gsc-index-report.csv — URLs not "Submitted and indexed" need attention.');
