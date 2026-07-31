/**
 * ENGINE RELEASES — which files belong to Tzohar and which belong to the client.
 *
 * A client site is a fork of this engine, so it drifts the moment the engine
 * improves. Studio can already rewrite a client's config and content JSON; what
 * it could not do was ship the *code* those artifacts are interpreted by, which
 * is how the first bespoke build ended up several hundred commits ahead
 * of the engine every other client was generated from. Nothing about that build
 * was unusual — it was ordinary product work with no route back into the engine.
 *
 * This module is the contract that makes a code sync safe: it decides, per file
 * path, who owns it. Studio then only ever writes engine-owned paths, so an
 * upgrade cannot touch a client's photographs, their copy, or their content.
 *
 * It is deliberately prefix-based rather than glob-based. Classification runs on
 * every path in two git trees (a few thousand strings) inside a serverless
 * request, and a wrong answer here overwrites someone's website — so the rules
 * need to be readable at a glance and cheap to evaluate, not expressive.
 */

import { MODULE_PATH_OWNERS } from "./module-paths";

export type PathOwner = "engine" | "client" | "excluded";

/**
 * Never leaves this repo. `studio/` and `marketing/` are separate applications
 * that happen to live alongside the engine; `docs/` is our documentation, not
 * the client's; the rest is build output and local state. Shipping any of it
 * into a client repo would at best confuse a client reading their own code and
 * at worst deploy the control plane onto the client's own domain.
 */
export const EXCLUDED_PREFIXES = [
  "studio/",
  /**
   * The founder's own artefacts for the reference build's personal brand —
   * Wikipedia drafts, Wikidata sync scripts. Engine-adjacent by accident of
   * living under `scripts/`, and 57 mentions of another person's name in every
   * client repo. Never ships.
   */
  "scripts/private/",
  /**
   * Our documents, not the client's. `CLAUDE.md` describes this framework and
   * carries fleet-wide operational context; `PRODUCTIZATION.md` is the business
   * model and price list. Both were seeded into client repos by the template —
   * an internal pricing document in a customer's repository is not a thing that
   * should be possible.
   */
  "CLAUDE.md",
  "PRODUCTIZATION.md",
  /* Our funding manifest, not the client's — a client repo should not be
     soliciting donations for our project. */
  "funding.json",
  "marketing/",
  "docs/",
  "graphify-out/",
  "node_modules/",
  ".next/",
  ".git/",
  ".vercel/",
  ".claude/",
  ".playwright-mcp/",
  "tsconfig.tsbuildinfo",
  ".env.local",
] as const;

/**
 * The client's. An engine sync must never write these, in either direction.
 *
 * `public/` is entirely theirs: a client's photographs are the most expensive
 * and least replaceable thing in the repo, and no engine improvement has ever
 * needed to overwrite one. `src/data/*.json` and `messages/*.json` are the
 * content Studio and the CRM already own through Publish. `site.values.json` is
 * their identity.
 */
export const CLIENT_PREFIXES = [
  "src/config/site.values.json",
  /**
   * Documented as a per-client file (see CLAUDE.md) but classified as engine, so
   * every client inherited the reference build's hub product key —
   * i.e. a membership gate pointed at somebody else's product on the accounts hub.
   */
  "src/config/membership.ts",
  "src/data/",
  "messages/",
  "public/",
  "README.md",
  "vercel.json",
  /**
   * `.gitignore` accumulates client-specific rules. The first real client's
   * ignores 617MB of raw source material (a client's asset pack) that must
   * never enter the repo; syncing the engine's copy over it would delete that
   * line, and the damage would surface later as a `git add -A` sweeping the lot
   * in. The template seeds this file — after that it is theirs.
   */
  ".gitignore",
] as const;

/**
 * Ours. Everything the site is *made of* — routes, components, the schema
 * package, build config.
 *
 * `package.json` and `package-lock.json` are here on purpose and are the two
 * riskiest entries: they carry dependency versions, so leaving them behind means
 * a synced component can import a package the client's lockfile has never heard
 * of, and the build fails after the commit has already landed. They move
 * together for the same reason. A client who has hand-added a dependency will
 * see both flagged as diverged rather than silently overwritten.
 */
export const ENGINE_PREFIXES = [
  "src/app/",
  "src/components/",
  "src/lib/",
  "src/i18n/",
  "src/config/",
  "packages/schema/",
  "scripts/",
  "middleware.ts",
  "next.config.ts",
  "next-env.d.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "tsconfig.json",
  "package.json",
  "package-lock.json",
  "engine.json",
  /* The licence has to travel with the code it licenses. Without these two
     here they default to "client" and a sync never places them, so a client
     repository ends up holding Apache-2.0 code with no Apache-2.0 file. */
  "LICENSE",
  "NOTICE",
  ".env.example",
] as const;

function matches(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => (p.endsWith("/") ? path.startsWith(p) : path === p));
}

/**
 * Who owns this repo-relative path.
 *
 * Order matters: exclusions win over everything, then client ownership, then
 * engine ownership. `src/data/` sits under no engine prefix but its *loaders*
 * (`pages.ts`, `posts.ts`) are engine code sitting in the same directory as the
 * content they read — so that one directory is split by extension rather than by
 * prefix. Anything unrecognised is treated as the client's, which is the safe
 * default: an unknown file the operator added by hand stays untouched.
 */
export function classifyEnginePath(path: string): PathOwner {
  const clean = path.replace(/^\/+/, "");
  if (!clean || clean.includes("..")) return "excluded";
  if (matches(clean, EXCLUDED_PREFIXES)) return "excluded";

  if (clean.startsWith("src/data/")) {
    return clean.endsWith(".json") ? "client" : "engine";
  }
  if (matches(clean, CLIENT_PREFIXES)) return "client";
  if (matches(clean, ENGINE_PREFIXES)) return "engine";
  return "client";
}

/**
 * MODULE PRUNING — a client repo only carries code for the modules it enables.
 *
 * `requireModule()` already 404s a disabled module's routes at runtime, which is
 * enough for a visitor and not enough for anything else: the FILES still ship, so
 * every client repo contained the reference build's music pages, its record-label
 * roster, its Instagram data and its press quotes. That is dead weight in their
 * build, another brand's copy in their repo, and a permanent source of "why does
 * my site mention someone else".
 *
 * `MODULE_PATH_OWNERS` (generated — see scripts/gen-module-paths.mjs) says which
 * modules each engine file exists to serve. A path is prunable only when EVERY
 * owner is disabled, because files are shared: `SectionDivider` belongs to five
 * modules and must survive if any one of them is on.
 *
 * Enabling a module later simply stops the path being pruned, so the next sync
 * adds the files back. Pruning is reversible by flipping the module.
 */
export function pathModuleOwners(path: string): readonly string[] {
  return MODULE_PATH_OWNERS[path.replace(/^\/+/, "")] ?? [];
}

/**
 * Should this engine path be left out of a repo whose modules are `enabled`?
 *
 * Only ever true for engine-owned paths that the generated table knows about, so
 * an unrecognised file is never pruned — the same fail-safe direction as
 * `classifyEnginePath`, where unknown paths default to the client's.
 */
export function isPrunedForModules(path: string, enabled: readonly string[] | undefined): boolean {
  const owners = pathModuleOwners(path);
  if (owners.length === 0) return false;
  const on = new Set(enabled ?? []);
  return owners.every((m) => !on.has(m));
}

/** The metadata block at the repo root (`engine.json`) that names a release. */
export interface EngineRelease {
  /** Semver. Bumped by whoever lands an engine change worth shipping. */
  version: string;
  /** Human name for the release, shown in Studio. */
  name?: string;
  /** ISO date. */
  released?: string;
  /** What a client gets by upgrading — the copy Studio shows on the Code tab. */
  highlights?: string[];
  /** Anything that needs an operator decision rather than a click. */
  breaking?: string[];
  /** New `site.modules` values this release introduces. */
  addsModules?: string[];
  /**
   * Highlights of earlier releases, newest-first by key. A client can be several
   * versions behind, and "what do I get" has to answer for the whole gap, not
   * just the newest bump.
   */
  previous?: Record<string, string[]>;
}

/** Parse a repo's `engine.json`, tolerating an older repo that has none. */
export function parseEngineRelease(json: string | null | undefined): EngineRelease | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json) as EngineRelease;
    return typeof v?.version === "string" ? v : null;
  } catch {
    return null;
  }
}

/** Compare two semver strings. Returns <0, 0, >0. Missing/odd values sort low. */
export function compareVersions(a: string | undefined, b: string | undefined): number {
  const parse = (v?: string) =>
    (v ?? "0")
      .split(".")
      .map((n) => Number.parseInt(n, 10))
      .map((n) => (Number.isFinite(n) ? n : 0));
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}
