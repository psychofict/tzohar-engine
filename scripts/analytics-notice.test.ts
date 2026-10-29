/**
 * The privacy notice names exactly the analytics a site loads (EBE-7044, decision EBE-7056).
 *
 * Checks src/lib/analytics.ts's list for each combination of settings (Vercel Web Analytics
 * always; Google Analytics, Plausible and Naver Analytics only when set), the notice's wording
 * built from it, and that scripts/check-analytics-notice.mjs passes on this repository and
 * fails on made-up copies that go around the list.
 *
 * Run: npx --yes tsx scripts/analytics-notice.test.ts
 * No network. The settings are made up.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { analyticsTools, joinWithAnd, type AnalyticsSettings } from "../src/lib/analytics";

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const sentence = (s: AnalyticsSettings) => joinWithAnd(analyticsTools(s).map((t) => t.name));
const sharing = (s: AnalyticsSettings) => analyticsTools(s).map((t) => t.company).join(", ");

console.log("1. The list follows the site's settings");
check("no settings: Vercel Web Analytics only", sentence({}) === "Vercel Web Analytics", sentence({}));
check("no settings: shared with Vercel only", sharing({}) === "Vercel", sharing({}));
const ga = { gaId: "G-MADEUP123" };
check("Google Analytics set", sentence(ga) === "Vercel Web Analytics and Google Analytics", sentence(ga));
check("Google Analytics set: shared with Vercel, Google", sharing(ga) === "Vercel, Google", sharing(ga));
const all = { gaId: "G-MADEUP123", plausibleDomain: "made-up.example", naverId: "madeup" };
check(
  "all three set",
  sentence(all) === "Vercel Web Analytics, Google Analytics, Plausible and Naver Analytics",
  sentence(all),
);
check("all three set: shared list", sharing(all) === "Vercel, Google, Plausible, Naver", sharing(all));
const pn = { plausibleDomain: "made-up.example", naverId: "madeup" };
check("Plausible and Naver set", sentence(pn) === "Vercel Web Analytics, Plausible and Naver Analytics", sentence(pn));
check("a blank setting counts as unset", sentence({ gaId: "  ", plausibleDomain: "" }) === "Vercel Web Analytics");
check("the loader gets the trimmed id", analyticsTools({ gaId: " G-X " }).some((t) => t.id === "google" && t.gaId === "G-X"));

console.log("2. The build check passes here and fails on a copy that goes around the list");
const script = join(__dirname, "check-analytics-notice.mjs");
const repo = join(__dirname, "..");
const run = (dir: string) => spawnSync(process.execPath, [script, dir], { encoding: "utf8" });
const here = run(repo);
check("passes on this repository", here.status === 0, here.stderr || here.stdout);

const paths = [
  "src/lib/analytics.ts",
  "src/components/Analytics.tsx",
  "src/app/[locale]/privacy/page.tsx",
  "src/app/[locale]/layout.tsx",
];
function copyWith(change: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), "analytics-notice-"));
  for (const p of paths) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), readFileSync(join(repo, p)));
  }
  change(dir);
  const r = run(dir);
  rmSync(dir, { recursive: true, force: true });
  return r;
}
const plain = copyWith(() => {});
check("passes on a plain copy of the three files", plain.status === 0, plain.stderr);

const stray = copyWith((d) => {
  mkdirSync(join(d, "src/components"), { recursive: true });
  writeFileSync(join(d, "src/components/Extra.tsx"), 'const id = process.env.NEXT_PUBLIC_GA_ID;\n');
});
check("fails when another file reads a setting", stray.status === 1 && /Extra\.tsx reads NEXT_PUBLIC_GA_ID/.test(stray.stderr), stray.stderr);

const loads = copyWith((d) => {
  writeFileSync(join(d, "src/components/Extra.tsx"), 'import { Analytics } from "@vercel/analytics/next";\n');
});
check("fails when another file loads an analytics script", loads.status === 1 && /Extra\.tsx loads @vercel\/analytics/.test(loads.stderr), loads.stderr);

const named = copyWith((d) => {
  const p = join(d, "src/app/[locale]/privacy/page.tsx");
  writeFileSync(p, readFileSync(p, "utf8") + "\n// we use Google Analytics\n");
});
check("fails when the notice names a tool itself", named.status === 1 && /names "Google"/.test(named.stderr), named.stderr);

const branch = copyWith((d) => {
  const p = join(d, "src/components/Analytics.tsx");
  writeFileSync(p, readFileSync(p, "utf8").replace('case "naver":', 'case "naver-old":'));
});
check("fails when the loader misses a tool", branch.status === 1 && /no branch for the "naver" tool/.test(branch.stderr), branch.stderr);

const customReads = copyWith((d) => {
  mkdirSync(join(d, "src/custom"), { recursive: true });
  writeFileSync(join(d, "src/custom/pages.tsx"), 'const id = process.env.NEXT_PUBLIC_GA_ID;\n');
});
check("lets the client's own src/custom read a setting", customReads.status === 0, customReads.stderr);

const customLoads = copyWith((d) => {
  mkdirSync(join(d, "src/custom"), { recursive: true });
  writeFileSync(join(d, "src/custom/pages.tsx"), 'const s = "https://www.googletagmanager.com/gtag/js";\n');
});
check(
  "fails when the client's own src/custom loads a tracker",
  customLoads.status === 1 && /src\/custom\/pages\.tsx loads googletagmanager\.com; add the tool/.test(customLoads.stderr),
  customLoads.stderr,
);

const wrapper = copyWith((d) => {
  mkdirSync(join(d, "src/custom"), { recursive: true });
  writeFileSync(join(d, "src/custom/pages.tsx"), 'import { GoogleAnalytics } from "@next/third-parties/google";\n');
});
check("fails when src/custom loads a tracker through a wrapper package", wrapper.status === 1 && /@next\/third-parties/.test(wrapper.stderr), wrapper.stderr);

const looped = copyWith((d) => {
  mkdirSync(join(d, "src/custom"), { recursive: true });
  symlinkSync(join(d, "src/custom/missing"), join(d, "src/custom/dangling"));
});
check("a dangling link under src is skipped, not a crash", looped.status === 0, looped.stderr);

const rootJs = copyWith((d) => {
  writeFileSync(join(d, "instrumentation-client.js"), 'import "@vercel/analytics";\n');
});
check("fails when instrumentation-client.js loads a tracker", rootJs.status === 1, rootJs.stderr);

const unmounted = copyWith((d) => {
  const p = join(d, "src/app/[locale]/layout.tsx");
  writeFileSync(p, readFileSync(p, "utf8").replace("<Analytics />", ""));
});
check("fails when the layout no longer mounts the loader", unmounted.status === 1 && /does not mount/.test(unmounted.stderr), unmounted.stderr);

const rootLoads = copyWith((d) => {
  writeFileSync(join(d, "instrumentation-client.ts"), 'import "@vercel/analytics";\n');
});
check("fails when instrumentation-client.ts loads a tracker", rootLoads.status === 1, rootLoads.stderr);

const bare = copyWith((d) => {
  const p = join(d, "src/app/[locale]/privacy/page.tsx");
  writeFileSync(p, readFileSync(p, "utf8") + "\n// <strong>Google</strong> — analytics.\n");
});
check("fails when the notice names a company itself", bare.status === 1 && /names "Google"/.test(bare.stderr), bare.stderr);

const newId = copyWith((d) => {
  const p = join(d, "src/lib/analytics.ts");
  writeFileSync(p, readFileSync(p, "utf8") + '\nconst extra = { id: "ga4-two" };\n');
});
check("fails when the list holds a tool id with digits the loader lacks", newId.status === 1 && /"ga4-two"/.test(newId.stderr), newId.stderr);

if (fails) {
  console.log(`\n${fails} check(s) failed`);
  process.exit(1);
}
console.log("\nall checks pass");
