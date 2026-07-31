/**
 * Generate `packages/schema/src/module-paths.ts` — which engine files exist only
 * to serve which modules.
 *
 * Studio uses it to stop shipping a client code for modules they have not
 * enabled. That has to be a static table: the sync runs inside a serverless
 * request and cannot walk a TypeScript import graph. But a hand-maintained table
 * would rot on the first refactor, so it is generated here and committed, and
 * `--check` fails if the committed copy has drifted.
 *
 *     node scripts/gen-module-paths.mjs          # write
 *     node scripts/gen-module-paths.mjs --check  # verify (exits 1 on drift)
 *
 * HOW OWNERSHIP IS DECIDED
 *
 * `requireModule("x")` in a route's layout/page is the ground truth for which
 * subtree a module gates — read from the source rather than guessed, so a new
 * module needs no edit here. From those roots we follow imports forward:
 *
 *   owners(f)      = every module whose gated subtree can reach f
 *   coreReaches(f) = f is reachable from a NON-gated Next entrypoint
 *   prunable(f)    = owners(f) is non-empty AND NOT coreReaches(f)
 *
 * A file shared by several modules (e.g. SectionDivider, used by ai/music/press/
 * tour/influencer) is prunable only when ALL of its owners are disabled, which is
 * why the value is a list and not a single module.
 *
 * `coreReaches` is the safety property. Core roots are genuine entrypoints only —
 * page/layout/route/sitemap/robots/manifest files outside any gate, plus
 * middleware and the i18n/config leaves. An earlier version treated every
 * non-gated FILE as a root, which made "core reaches it" trivially true and
 * silently reduced the map to route files alone.
 *
 * API handlers are entrypoints that nothing imports, so the graph cannot infer
 * their owner; they are attributed explicitly in API_OWNERS below. Everything
 * else is derived.
 */
import { readFileSync, existsSync, statSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const OUT = "packages/schema/src/module-paths.ts";

/** API routes have no importers, so they cannot be derived. Keep in sync by hand. */
const API_OWNERS = {
  "src/app/api/spotify-albums/": ["music"],
  "src/app/api/spotify-artist/": ["music"],
  "src/app/api/spotify-artists/": ["music"],
  "src/app/api/membership/": ["membership"],
  "src/app/api/account/": ["membership"],
  "src/app/api/checkout/": ["membership"],
  "src/app/api/superfan/": ["vault"],
  "src/app/api/orcid-publications/": ["research"],
  "src/app/api/admin/": ["crm"],
};

// `--others --exclude-standard` so a NEW file that hasn't been committed yet is
// still analysed. With plain `ls-files` an untracked module file is invisible, and
// the map silently omits it — which reads as "not prunable" rather than as an error.
const files = execSync("git ls-files --cached --others --exclude-standard src packages/schema/src", { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter((f) => /\.(ts|tsx)$/.test(f));

const resolveSpec = (from, spec) => {
  let base;
  if (spec.startsWith("@/")) base = path.join("src", spec.slice(2));
  else if (spec.startsWith("@tzohar/schema")) return "packages/schema/src/index.ts";
  else if (spec.startsWith(".")) base = path.normalize(path.join(path.dirname(from), spec));
  else return null;
  for (const c of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
};

const importsOf = new Map();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const specs = [...src.matchAll(/(?:from\s+|import\s*\(\s*)["']([^"']+)["']/g)].map((m) => m[1]);
  importsOf.set(f, new Set(specs.map((s) => resolveSpec(f, s)).filter(Boolean)));
}

// module -> gated subtrees, from requireModule() in the source
const gates = new Map();
for (const f of files) {
  const m = readFileSync(f, "utf8").match(/requireModule\(\s*["']([a-z]+)["']/);
  if (!m) continue;
  let dir = path.dirname(f);
  if (/\/\(app\)$/.test(dir)) dir = path.dirname(dir); // route groups aren't URL segments
  gates.set(m[1], [...(gates.get(m[1]) ?? []), dir]);
}

const under = (f, dir) => f === dir || f.startsWith(`${dir}/`);
const inAnyGate = (f) => [...gates.values()].some((dirs) => dirs.some((d) => under(f, d)));
const reach = (roots) => {
  const seen = new Set();
  const stack = [...roots];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    for (const d of importsOf.get(f) ?? []) stack.push(d);
  }
  return seen;
};

const owners = new Map(files.map((f) => [f, new Set()]));
for (const [m, dirs] of gates) {
  for (const f of reach(files.filter((f) => dirs.some((d) => under(f, d))))) owners.get(f)?.add(m);
}

const ENTRY = /(?:^|\/)(?:page|layout|route|sitemap|robots|manifest|not-found|error|global-error|template|default)\.tsx?$/;
const coreReach = reach(
  files.filter(
    (f) =>
      !inAnyGate(f) &&
      (ENTRY.test(f) || f === "middleware.ts" || f.startsWith("src/i18n/") || f.startsWith("src/config/")),
  ),
);

const table = {};
for (const f of files) {
  const o = owners.get(f);
  if (o.size > 0 && !coreReach.has(f)) table[f] = [...o].sort();
}
for (const f of files) {
  for (const [prefix, mods] of Object.entries(API_OWNERS)) if (f.startsWith(prefix)) table[f] = [...mods];
}

const body = `/**
 * GENERATED by scripts/gen-module-paths.mjs — do not edit by hand.
 * Regenerate after adding or moving a module's files:
 *     node scripts/gen-module-paths.mjs
 *
 * Maps an engine file to the modules it exists to serve. A file is safe to leave
 * out of a client repo only when EVERY module listed for it is disabled there.
 * See the generator for how ownership is derived and why it is not hand-written.
 */
export const MODULE_PATH_OWNERS: Record<string, readonly string[]> = ${JSON.stringify(
  Object.fromEntries(Object.entries(table).sort(([a], [b]) => a.localeCompare(b))),
  null,
  2,
)};
`;

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== body) {
    console.error(`${OUT} is out of date — run: node scripts/gen-module-paths.mjs`);
    process.exit(1);
  }
  console.log(`${OUT} is current (${Object.keys(table).length} paths).`);
} else {
  writeFileSync(OUT, body);
  console.log(`wrote ${OUT} — ${Object.keys(table).length} paths across ${gates.size} modules`);
}
