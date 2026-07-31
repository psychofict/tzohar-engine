/**
 * Merging `package.json` into a client repo, instead of overwriting it.
 *
 * Every other engine file is copied wholesale, which is right: a client does not
 * own `src/components/ui/PageHero.tsx`, and a byte-for-byte copy is exactly what
 * a sync should leave behind. `package.json` is the one engine-owned file that is
 * genuinely SHARED — the engine decides which framework versions the code needs,
 * and the repo decides what it is called and what commands it offers.
 *
 * Overwriting it therefore did two wrong things at once. It pushed our internal
 * tooling into client repos (`npm run quota` reads OUR Vercel account's
 * deployment allowance; `hooks:install` points at a `.githooks/` directory a
 * client does not have), and it destroyed any hand-trim — the client template and
 * the first real client both carried a trimmed `scripts` block that the next sync
 * silently undid. It also meant a client who added a single dependency saw
 * `package.json` reported as a permanent conflict, because "differs from the
 * release" was the only question being asked.
 *
 * WHAT IS DECIDED, AND BY WHOM
 *
 * - `dependencies` / `devDependencies` / `overrides` — the ENGINE's, because they
 *   are what the engine's code compiles against and where a security patch lands.
 *   Keys only the client has are kept: dropping a dependency somebody added
 *   breaks their build, while carrying one the engine no longer needs costs disk.
 *   The fail-safe direction is "keep".
 * - `scripts` — DERIVED, not listed. See `scriptShips`.
 * - everything else (`name`, `version`, `private`, `license`, `description`, …) —
 *   the CLIENT's. Their repo's identity is not ours to state, and an engine value
 *   is never introduced for a key they don't already have.
 *
 * Unrecognised top-level keys are left exactly as the client has them. Same
 * fail-safe direction as `classifyEnginePath`: what this file does not understand,
 * it does not touch.
 */

import { classifyEnginePath } from "./engine";

/** Sections whose contents the engine resolves; client-only keys survive. */
const ENGINE_DEPENDENCY_SECTIONS = ["dependencies", "devDependencies", "overrides"] as const;

export interface PackageMerge {
  /** The merged file, serialised ready to commit. */
  text: string;
  /** False when the client's file already says all of this — nothing to write. */
  changed: boolean;
  /** Engine scripts withheld because the client won't have the files they call. */
  droppedScripts: string[];
  /**
   * Dependencies present in the client's file and not the engine's.
   *
   * Load-bearing for the CALLER, not for the merge: `package-lock.json` is copied
   * from the release wholesale, and a lockfile that disagrees with its
   * `package.json` makes `npm ci` fail outright — which is what Vercel runs. When
   * this is empty the merged manifest has exactly the release's dependency set and
   * the release lockfile is precisely correct. When it isn't, somebody has to look.
   */
  clientOnlyDependencies: string[];
}

/**
 * Paths a shell command refers to, as repo-relative candidates.
 *
 * Deliberately conservative: absolute paths (`/dev/null` out of a `2>/dev/null`
 * redirection) are not repo paths, flags are not paths, and a bare dotted word
 * like `core.hooksPath` is an argument rather than a file. Anything this fails to
 * recognise simply isn't consulted, which biases toward shipping a script — the
 * same direction the rest of the sync errs in.
 */
export function referencedPaths(command: string): string[] {
  const cleaned = command.replace(/\d?>>?|<|\|\||&&|[;|&()]/g, " ");
  const out: string[] = [];
  for (const raw of cleaned.split(/\s+/)) {
    const tok = raw.replace(/^["']+|["']+$/g, "").trim();
    if (!tok || tok === "." || tok === ".." || tok.startsWith("-") || tok.startsWith("/")) continue;
    const looksLikePath = tok.includes("/") || /^\.[\w.-]+$/.test(tok);
    if (!looksLikePath || !/^[.\w][\w./@-]*$/.test(tok)) continue;
    out.push(tok.replace(/\/+$/, ""));
  }
  return out;
}

/**
 * Should an engine script be offered to a client repo?
 *
 * Derived from the file the script actually calls, rather than a hand-kept
 * allowlist that would go stale the first time somebody adds a script and forgets
 * this file. A script ships when every repo path it names is engine-classified —
 * i.e. when the sync will genuinely put those files there:
 *
 *   "next build"                              no path      → ships
 *   "node scripts/gen-module-paths.mjs"       engine       → ships
 *   "node scripts/private/vercel-quota.mjs"   excluded     → withheld
 *   "git config core.hooksPath .githooks"     client's     → withheld
 *
 * The last two are the interesting ones, and note they are withheld for the same
 * reason rather than by name: the sync will not place `scripts/private/` (ours)
 * and will not place `.githooks/` (theirs to write), so in a client repo both
 * commands would name a file that isn't there.
 */
export function scriptShips(command: string): boolean {
  return referencedPaths(command).every((p) => classifyEnginePath(p) === "engine");
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asRecord(v: unknown): Record<string, unknown> {
  return isPlainObject(v) ? v : {};
}

/** 2-space indent and a trailing newline — what npm itself writes. */
function serialise(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Merge the engine's `package.json` into a client's.
 *
 * Key ORDER follows the client's file, with anything new appended, so the diff an
 * operator reviews is the semantic change and not a whole-file reshuffle. That
 * also makes the `changed` flag meaningful: the comparison is against the client's
 * own object re-serialised the same way, so a repo that merely uses 4-space indent
 * is not reported as differing every single sync.
 */
export function mergePackageJson(releaseText: string, clientText: string): PackageMerge {
  const release = asRecord(JSON.parse(releaseText));
  const client = asRecord(JSON.parse(clientText));

  const merged: Record<string, unknown> = { ...client };

  // ── dependencies: the engine resolves, client-only keys survive ────────────
  const releaseDepNames = new Set<string>();
  for (const section of ENGINE_DEPENDENCY_SECTIONS) {
    for (const name of Object.keys(asRecord(release[section]))) releaseDepNames.add(name);
  }

  const clientOnlyDependencies: string[] = [];
  for (const section of ENGINE_DEPENDENCY_SECTIONS) {
    const fromRelease = asRecord(release[section]);
    const fromClient = asRecord(client[section]);
    /*
     * A dependency the engine moved between `dependencies` and `devDependencies`
     * must not survive in BOTH — so a client entry is kept only when the release
     * has no opinion about that package anywhere, not merely when it is absent
     * from this one section.
     */
    const kept: Record<string, unknown> = {};
    for (const [name, range] of Object.entries(fromClient)) {
      if (!releaseDepNames.has(name)) {
        kept[name] = range;
        clientOnlyDependencies.push(name);
      }
    }
    const next = { ...kept, ...fromRelease };
    if (Object.keys(next).length > 0) merged[section] = sortKeys(next);
    else delete merged[section];
  }

  // ── scripts: engine keys are decided here, client keys are theirs ──────────
  const releaseScripts = asRecord(release.scripts) as Record<string, string>;
  const clientScripts = asRecord(client.scripts) as Record<string, string>;
  const droppedScripts: string[] = [];
  const scripts: Record<string, string> = {};

  // The client's own additions first, in their order — a key the engine has never
  // heard of belongs to them and is passed through untouched.
  for (const [name, cmd] of Object.entries(clientScripts)) {
    if (!(name in releaseScripts)) scripts[name] = cmd;
  }
  for (const [name, cmd] of Object.entries(releaseScripts)) {
    if (typeof cmd === "string" && scriptShips(cmd)) scripts[name] = cmd;
    else droppedScripts.push(name);
  }
  if (Object.keys(scripts).length > 0) merged.scripts = scripts;
  else delete merged.scripts;

  const text = serialise(merged);
  return {
    text,
    changed: text !== serialise(client),
    droppedScripts: droppedScripts.sort(),
    clientOnlyDependencies: [...new Set(clientOnlyDependencies)].sort(),
  };
}

function sortKeys(o: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}
