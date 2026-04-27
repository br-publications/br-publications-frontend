/**
 * SEO Audit Script — run AFTER `npm run build`
 * Usage: node scripts/audit-seo.mjs
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, "..", "dist");
const GENERIC_TITLE = "Academic Books & Research";

let passed = 0, failed = 0, warnings = 0;

function findHtmlFiles(dir, files = []) {
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) findHtmlFiles(full, files);
    else if (item === "index.html") files.push(full);
  }
  return files;
}

function extractAll(html, pattern) {
  return [...html.matchAll(new RegExp(pattern, "gi"))].map(m => m[1]?.trim() || "");
}

function auditFile(filePath) {
  const rel = relative(DIST_DIR, filePath);
  const html = readFileSync(filePath, "utf-8");
  const titles       = extractAll(html, "<title[^>]*>([^<]*)<\\/title>");
  const descriptions = extractAll(html, "<meta\\s+name=[\"']description[\"']\\s+content=[\"']([^\"']*)[\"']");
  const isHomePage   = rel === "index.html";
  const issues = [];

  if (titles.length === 0 || titles.every(t => !t)) issues.push("NO TITLE");
  if (titles.length > 1) issues.push(`DUPLICATE TITLES (${titles.length})`);
  if (!isHomePage && titles.some(t => t.includes(GENERIC_TITLE))) issues.push("GENERIC TITLE on dynamic page");
  if (descriptions.length > 1) issues.push(`DUPLICATE DESCRIPTIONS (${descriptions.length})`);
  if (!isHomePage && descriptions.some(d => d.includes("Explore peer-reviewed academic books"))) issues.push("GENERIC DESCRIPTION on dynamic page");

  if (issues.length === 0) {
    console.log(`OK   ${rel}\n     "${(titles[0]||"").slice(0,70)}"`);
    passed++;
  } else {
    console.log(`\nFAIL ${rel}`);
    issues.forEach(i => { console.log(`     => ${i}`); failed++; });
    if (titles[0])       console.log(`     Title: "${titles[0].slice(0,80)}"`);
    if (descriptions[0]) console.log(`     Desc : "${descriptions[0].slice(0,80)}"\n`);
  }
}

console.log("\nBR Publications - SEO Audit\n" + "=".repeat(60));
const files = findHtmlFiles(DIST_DIR);
if (!files.length) { console.error("No HTML files. Run npm run build first."); process.exit(1); }
files.forEach(auditFile);
console.log("\n" + "=".repeat(60));
console.log(`Checked ${files.length} pages | Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) { console.log("\nFix issues and rebuild."); process.exit(1); }
else console.log("\nAll pages have correct meta tags!");
