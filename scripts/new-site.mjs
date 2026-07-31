#!/usr/bin/env node
/**
 * Scaffold a fresh Tzohar Sites build for a new client.
 *
 * Run this in a fresh clone of the framework — it regenerates the per-client
 * VALUES artifact (src/config/site.values.json) with a clean starter. This is
 * the same JSON file Tzohar Studio generates & commits (see docs/studio.md);
 * the engine validates it against @tzohar/schema at load. The engine, types,
 * and helpers are untouched.
 *
 *   npm run new-site -- --name "Jane Doe" --url https://janedoe.com [--theme violet] [--force]
 */
import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const THEMES = ["default", "violet", "emerald", "sunset", "rose", "slate"];

// --- parse flags ---
const argv = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) {
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }
}

const name = typeof args.name === "string" ? args.name : "";
const url = typeof args.url === "string" ? args.url.replace(/\/+$/, "") : "";
const theme = THEMES.includes(args.theme) ? args.theme : "default";
const force = !!args.force;

if (!name || !url) {
  console.error(
    'Usage: npm run new-site -- --name "Display Name" --url https://example.com [--theme violet] [--force]\n' +
      `Themes: ${THEMES.join(", ")}`,
  );
  process.exit(1);
}

let host = "example.com";
try {
  host = new URL(url).hostname.replace(/^www\./, "");
} catch {
  console.error(`Invalid --url: ${url}`);
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(root, "src/config/site.values.json");

if (existsSync(target) && !force) {
  console.error(
    "src/config/site.values.json already exists.\n" +
      "Re-run with --force to overwrite (do this in a fresh clone for the new client).",
  );
  process.exit(1);
}

// The per-client identity artifact is JSON — the same shape Tzohar Studio emits.
// Options for `modules`: music, label, ai, influencer, tour, gallery, vault,
// merch, membership, press, links. `kind`: person | musician | creator | business.
const starter = {
  name,
  kind: "person",
  tagline: "",
  description: `${name} — official website.`,
  url,
  email: `hello@${host}`,
  location: { based: "", from: "" },
  brand: {
    logoLight: "/images/logo-dark.png",
    logoDark: "/images/logo-light.png",
    ogImage: "/images/og-image.jpg",
  },
  theme,
  locales: { default: "en", enabled: ["en"] },
  seo: { titleDefault: name },
  socials: [],
  modules: ["links"],
};

const content = JSON.stringify(starter, null, 2) + "\n";

writeFileSync(target, content);
console.log(`✓ Wrote src/config/site.values.json for "${name}" (theme: ${theme})\n`);
console.log("Next steps:");
console.log("  1. Add logo + OG assets in /public and point brand.* at them");
console.log("  2. Pick modules (site.modules) + membership provider (src/config/membership.ts)");
console.log("  3. Fill per-module content in src/data/* and translations in messages/en.json");
console.log("  4. npm run dev   →   then npm run build before deploy");
console.log("\nSee docs/new-build-checklist.md for the full checklist.");
