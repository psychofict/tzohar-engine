#!/usr/bin/env node
/**
 * Are this site's `messages/` files complete for the code this site actually ships?
 *
 * next-intl throws on a missing key, but only when something asks for it — so a
 * trimmed messages file fails at RENDER, on one page, in one locale, often only
 * in production. That is how it went wrong while cutting 2.6.0: the client
 * template's en.json had been trimmed, the engine had since added thirteen keys
 * across about/contact/common/footer/notFound, and nothing noticed until a build
 * rendered those pages.
 *
 * The reference is derived from THIS repo's source, not from the engine's
 * messages file. That distinction is the whole design: a client running three
 * modules legitimately has no `metadata.musicTitle`, and comparing whole
 * namespaces against the engine reported 41 such keys as missing on a build that
 * compiles and renders perfectly. A check that cries wolf stops being read.
 *
 * Because module pruning removes a disabled module's source files, scanning the
 * repo is pruning-aware for free.
 *
 *   node scripts/check-messages.mjs
 *   node scripts/check-messages.mjs --list   # show every required key
 *
 * Static analysis, so it reads literal `t("key")` calls. Keys built at runtime
 * (`t(item.labelKey)`) cannot be resolved and are counted and reported as
 * unverified rather than guessed at — under-reporting is the safe direction for
 * a check that fails a build.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const MESSAGES = join(ROOT, "messages");
const SRC = join(ROOT, "src");

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const read = (p) => JSON.parse(readFileSync(p, "utf8"));

function sourceFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if ([".ts", ".tsx"].includes(extname(name))) acc.push(full);
  }
  return acc;
}

/**
 * Namespaces a file binds, and the keys it asks for.
 *
 * `useTranslations("x")` / `getTranslations("x")` / `getTranslations({namespace:"x"})`
 * bind a namespace to a variable; the variable is then called with a key. Most
 * files bind one or two, so attributing every call in the file to every
 * namespace it binds is a deliberate over-approximation of the NAMESPACE and an
 * exact read of the KEY — it can ask "does `common` also need `title`?", which
 * is a false positive we then filter by requiring the key to exist in at least
 * one bound namespace.
 */
const BIND = /(?:use|get)Translations\s*\(\s*(?:\{[^}]*namespace\s*:\s*)?["'`]([\w.]+)["'`]/g;
const CALL = /\b(?:t|tc|tn|tHome|tCommon|tNav)\s*(?:\.(?:rich|raw|markup))?\s*\(\s*["'`]([\w.]+)["'`]/g;
const DYNAMIC = /\b(?:t|tc|tn)\s*(?:\.(?:rich|raw|markup))?\s*\(\s*(?!["'`])/g;

let dynamic = 0;
/** One entry per call site: the candidate namespace-qualified keys it could mean. */
const callSites = [];
for (const f of sourceFiles(SRC)) {
  const body = readFileSync(f, "utf8");
  const namespaces = [...new Set([...body.matchAll(BIND)].map((m) => m[1]))];
  if (!namespaces.length) continue;
  dynamic += [...body.matchAll(DYNAMIC)].length;
  for (const m of body.matchAll(CALL)) {
    callSites.push({ file: f, key: m[1], candidates: namespaces.map((ns) => `${ns}.${m[1]}`) });
  }
}

const cfgPath = join(ROOT, "src/config/site.values.json");
const locales = existsSync(cfgPath) ? (read(cfgPath).locales?.enabled ?? ["en"]) : ["en"];

/*
 * A key is only genuinely required if it exists in the default locale under one
 * of the namespaces that bind it — that filters the over-approximation above.
 * The default locale is therefore the source of truth for WHICH keys exist, and
 * the other locales are checked for completeness against it.
 */
const defaultPath = join(MESSAGES, `${locales[0]}.json`);
if (!existsSync(defaultPath)) {
  console.error(`✗ messages/${locales[0]}.json is missing but it is the default locale`);
  process.exit(1);
}
const base = flatten(read(defaultPath));

/*
 * Resolve each call site to the ONE candidate the default locale defines. A file
 * that binds two namespaces produces two candidates per call; counting both as
 * required turned 133 real keys into 343 phantom ones. A site is only unresolved
 * when NO candidate exists — which is the case actually worth looking at.
 */
const real = [];
const unresolvedSites = [];
for (const site of callSites) {
  const hit = site.candidates.filter((c) => c in base);
  if (hit.length) real.push(...hit);
  else unresolvedSites.push(site);
}
const realKeys = [...new Set(real)];

if (process.argv.includes("--list")) {
  for (const k of realKeys.sort()) console.log(k);
}

let bad = 0;
for (const locale of locales) {
  const p = join(MESSAGES, `${locale}.json`);
  if (!existsSync(p)) {
    console.error(`✗ ${locale}: messages/${locale}.json is missing but the locale is enabled`);
    bad++;
    continue;
  }
  const mine = flatten(read(p));
  const missing = realKeys.filter((k) => !(k in mine));
  if (missing.length) {
    bad++;
    console.error(`✗ ${locale}: ${missing.length} key(s) this build asks for are absent`);
    for (const k of missing.slice(0, 20)) console.error(`    ${k}`);
    if (missing.length > 20) console.error(`    …and ${missing.length - 20} more`);
  } else {
    console.log(`✓ ${locale}: all ${realKeys.length} key(s) this build asks for are present`);
  }
}

/*
 * Keys the source asks for that the default locale does not define. Usually the
 * over-approximation (a key attributed to the wrong one of two namespaces bound
 * in the same file) — but a genuine missing key lands here too, so it is shown
 * rather than swallowed. It does not fail the run: the default locale is by
 * definition the set of keys that exist.
 */
if (unresolvedSites.length) {
  console.log(`  ${unresolvedSites.length} call site(s) name a key no bound namespace defines in ${locales[0]}:`);
  for (const s of unresolvedSites.slice(0, 10)) {
    console.log(`    ${s.key}  (${s.file.replace(ROOT + "/", "")} binds ${s.candidates.map((c) => c.split(".")[0]).join(", ")})`);
  }
  if (unresolvedSites.length > 10) console.log(`    …and ${unresolvedSites.length - 10} more`);
}
if (dynamic) {
  console.log(`  ${dynamic} runtime-built key(s) could not be checked statically — the build is the backstop for those.`);
}
process.exit(bad ? 1 : 0);
