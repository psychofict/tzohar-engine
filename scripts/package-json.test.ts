import { mergePackageJson, scriptShips, referencedPaths } from "../packages/schema/src/package-json";

let fails = 0;
const check = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`}`);
};

// ── path extraction: the part that decides whether a script ships ───────────
check("bare tool invocation names no path", referencedPaths("next build"), []);
check("script file", referencedPaths("node scripts/gen-module-paths.mjs"), ["scripts/gen-module-paths.mjs"]);
check("flags are not paths", referencedPaths("npx --yes tsx scripts/tex.test.ts"), ["scripts/tex.test.ts"]);
check("a redirection target is not a repo path",
  referencedPaths("git config core.hooksPath .githooks 2>/dev/null || true"), [".githooks"]);
check("core.hooksPath is an argument, not a file", referencedPaths("git config core.hooksPath x"), []);
check("trailing slash trimmed", referencedPaths("rm -rf .next/"), [".next"]);

// ── shippability, derived from classifyEnginePath ───────────────────────────
check("no path at all ships", scriptShips("next build"), true);
check("engine script ships", scriptShips("node scripts/gen-module-paths.mjs"), true);
check("engine test ships", scriptShips("npx --yes tsx scripts/bibtex.test.ts"), true);
check("OUR vercel tooling is withheld", scriptShips("node scripts/private/vercel-quota.mjs"), false);
check("a client-owned path is withheld", scriptShips("git config core.hooksPath .githooks"), false);

// ── the real case: what a sync would have done to jafter-site ───────────────
const ENGINE = JSON.stringify({
  name: "tzohar-sites",
  private: true,
  scripts: {
    dev: "next dev",
    prepare: "git config core.hooksPath .githooks 2>/dev/null || true",
    build: "next build",
    "check-messages": "node scripts/check-messages.mjs",
    "hooks:install": "git config core.hooksPath .githooks",
    quota: "node scripts/private/vercel-quota.mjs",
    "test:tex": "npx --yes tsx scripts/tex.test.ts",
  },
  dependencies: { next: "^16.2.12", react: "19.2.3" },
  devDependencies: { typescript: "^5" },
  overrides: { postcss: "^8.5.25" },
  license: "Apache-2.0",
});

const CLIENT = JSON.stringify({
  name: "jafter-site",
  private: true,
  scripts: { dev: "next dev", build: "next build", "check-messages": "node scripts/check-messages.mjs" },
  dependencies: { next: "16.1.6", react: "19.2.3" },
  devDependencies: { typescript: "^5" },
});

const m = mergePackageJson(ENGINE, CLIENT);
const out = JSON.parse(m.text);

check("the security bump lands", out.dependencies.next, "^16.2.12");
check("overrides are introduced", out.overrides, { postcss: "^8.5.25" });
check("our Vercel tooling does NOT reach the client", "quota" in out.scripts, false);
check("nor does a hook pointing at a directory they lack", "hooks:install" in out.scripts, false);
check("nor prepare, for the same reason", "prepare" in out.scripts, false);
check("engine scripts they should have do arrive", out.scripts["test:tex"], "npx --yes tsx scripts/tex.test.ts");
check("the repo keeps its own name", out.name, "jafter-site");
check("no licence is asserted on their behalf", "license" in out, false);
check("what was withheld is reported", m.droppedScripts, ["hooks:install", "prepare", "quota"]);
check("no dependency drift, so the release lockfile is exactly right", m.clientOnlyDependencies, []);
check("something changed", m.changed, true);

// ── idempotence: the second sync must be a no-op ────────────────────────────
const again = mergePackageJson(ENGINE, m.text);
check("merging twice changes nothing", again.changed, false);
check("and is byte-identical", again.text, m.text);

// ── a client who added things keeps them ────────────────────────────────────
const CUSTOM = JSON.stringify({
  name: "custom-site",
  scripts: { build: "next build", deploy: "./deploy.sh" },
  dependencies: { next: "16.1.6", "chart.js": "^4.0.0" },
});
const c = mergePackageJson(ENGINE, CUSTOM);
const cOut = JSON.parse(c.text);
check("a script the engine never heard of survives", cOut.scripts.deploy, "./deploy.sh");
check("a dependency they added survives", cOut.dependencies["chart.js"], "^4.0.0");
check("and is flagged, because the release lockfile will not have it",
  c.clientOnlyDependencies, ["chart.js"]);

// ── a dependency the engine MOVED must not end up in both sections ──────────
const MOVED_ENGINE = JSON.stringify({ dependencies: {}, devDependencies: { sharp: "^0.35.3" } });
const MOVED_CLIENT = JSON.stringify({ dependencies: { sharp: "^0.34.5" } });
const moved = mergePackageJson(MOVED_ENGINE, MOVED_CLIENT);
const mOut = JSON.parse(moved.text);
check("gone from dependencies", mOut.dependencies, undefined);
check("present once, in devDependencies", mOut.devDependencies, { sharp: "^0.35.3" });
check("a move is not mistaken for a client addition", moved.clientOnlyDependencies, []);

console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
