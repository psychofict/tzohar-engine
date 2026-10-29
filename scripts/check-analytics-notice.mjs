#!/usr/bin/env node
/**
 * Fails the build when the privacy notice and the analytics a site loads could differ
 * (EBE-7044, decision EBE-7056). Runs in `prebuild`.
 *
 * src/lib/analytics.ts decides the set; src/components/Analytics.tsx loads it and the privacy
 * notice names it. This check makes sure nothing goes around that one list:
 *   1. only src/lib/analytics.ts reads the three analytics settings;
 *   2. only src/components/Analytics.tsx loads an analytics script or @vercel/analytics;
 *   3. Analytics.tsx and the privacy notice both take the list from src/lib/analytics.ts, the
 *      loader has a branch for every tool the list can hold, and the notice names no tool itself.
 * The client's own src/custom/ is read for script loads only (rule 2): a tracker added there
 * belongs in src/lib/analytics.ts, so that the notice names it too.
 *
 * Run: node scripts/check-analytics-notice.mjs [repo root]
 */
import { readFileSync, readdirSync, lstatSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.argv[2] || process.cwd();
const HELPER = "src/lib/analytics.ts";
const LOADER = "src/components/Analytics.tsx";
const NOTICE = "src/app/[locale]/privacy/page.tsx";
const LAYOUT = "src/app/[locale]/layout.tsx";

const SETTINGS = ["NEXT_PUBLIC_GA_ID", "NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "NEXT_PUBLIC_NAVER_ANALYTICS_ID"];
// The engine's four tools, then common trackers and wrappers a client might add on their own.
const LOADS = [
  "googletagmanager.com", "plausible.io/js", "wcslog.js", "@vercel/analytics",
  "@next/third-parties", "next-plausible", "google-analytics.com", "clarity.ms",
  "connect.facebook.net", "static.hotjar.com", "cdn.matomo.cloud", "matomo.js", "umami.is",
];
const NAMES = ["Vercel", "Google", "Plausible", "Naver"];

const problems = [];
const rel = (p) => relative(root, p).split(sep).join("/");

function walk(dir, out) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = lstatSync(p);
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name)) out.push(p);
  }
  return out;
}

// next.config.ts is left out on purpose: its security policy names the analytics hosts a
// site may reach, which loads nothing.
const files = walk(join(root, "src"), []);
// Root files Next runs: middleware, and instrumentation-client, which runs in the browser.
for (const base of ["middleware", "instrumentation", "instrumentation-client"]) for (const ext of ["ts", "js", "mjs"]) {
  const extra = `${base}.${ext}`;
  if (existsSync(join(root, extra))) files.push(join(root, extra));
}

for (const file of files) {
  const r = rel(file);
  const text = readFileSync(file, "utf8");
  const custom = r.startsWith("src/custom/");
  if (r !== HELPER && !custom) {
    for (const s of SETTINGS) if (text.includes(s)) problems.push(`${r} reads ${s}; only ${HELPER} may`);
  }
  if (r !== LOADER) {
    for (const l of LOADS) {
      if (!text.includes(l)) continue;
      problems.push(custom
        ? `${r} loads ${l}; add the tool to ${HELPER} so the privacy notice names it`
        : `${r} loads ${l}; only ${LOADER} may`);
    }
  }
}

const read = (r) => (existsSync(join(root, r)) ? readFileSync(join(root, r), "utf8") : null);
const helper = read(HELPER);
const loader = read(LOADER);
const notice = read(NOTICE);
const takesList = (text) => /import\s*\{[^}]*\banalyticsTools\b[^}]*\}\s*from\s*["']@\/lib\/analytics["']/.test(text);

if (!helper) problems.push(`${HELPER} is missing`);
if (!loader) problems.push(`${LOADER} is missing`);
else if (!takesList(loader)) problems.push(`${LOADER} does not take its list from ${HELPER}`);
if (!notice) problems.push(`${NOTICE} is missing`);
else {
  if (!takesList(notice)) problems.push(`${NOTICE} does not take its list from ${HELPER}`);
  for (const n of NAMES) if (notice.includes(n)) problems.push(`${NOTICE} names "${n}" itself; it must come from ${HELPER}`);
}
const layout = read(LAYOUT);
if (!layout) problems.push(`${LAYOUT} is missing`);
else if (!/import\s+Analytics\s+from\s+["']@\/components\/Analytics["']/.test(layout) || !layout.includes("<Analytics />")) {
  problems.push(`${LAYOUT} does not mount ${LOADER}, so the notice would name tools the site never loads`);
}
if (helper && loader) {
  const ids = [...helper.matchAll(/\{\s*id:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
  if (ids.length === 0) problems.push(`${HELPER} lists no tools`);
  for (const id of new Set(ids)) {
    if (!loader.includes(`case "${id}":`)) problems.push(`${LOADER} has no branch for the "${id}" tool`);
  }
}

if (problems.length) {
  console.error("✗ The privacy notice could name other analytics than the site loads (EBE-7044):");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("✓ analytics: one list for the loader and the privacy notice");
