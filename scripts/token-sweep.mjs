// One-shot token sweep for Phase 1.
// Replaces aliased class names and brand hex with semantic design tokens.
// Run from project root: node scripts/token-sweep.mjs <file ...>
import fs from "node:fs";
import path from "node:path";

const replacements = [
  // Alias classes
  ["bg-soft-white", "bg-surface"],
  ["bg-sky-tint", "bg-surface"],
  ["bg-background", "bg-bg"],

  // Foreground -> ink scale (most common opacities first)
  [/text-foreground\/80/g, "text-ink"],
  [/text-foreground\/70/g, "text-ink-2"],
  [/text-foreground\/60/g, "text-ink-2"],
  [/text-foreground\/55/g, "text-ink-2"],
  [/text-foreground\/50/g, "text-ink-3"],
  [/text-foreground\/45/g, "text-ink-3"],
  [/text-foreground\/40/g, "text-ink-3"],
  [/text-foreground\/35/g, "text-ink-3"],
  [/text-foreground\/30/g, "text-ink-3"],
  [/text-foreground\/25/g, "text-ink-3"],
  [/text-foreground\/20/g, "text-ink-3"],
  [/text-foreground\/15/g, "text-ink-3"],
  [/text-foreground\/10/g, "text-ink-3"],
  [/border-foreground\/\[0\.06\]/g, "border-line"],
  [/border-foreground\/\[0\.08\]/g, "border-line"],
  [/border-foreground\/10/g, "border-line"],
  [/border-foreground\/15/g, "border-line"],
  [/border-foreground\/20/g, "border-line-strong"],
  [/placeholder-foreground\/30/g, "placeholder-ink-3"],
  [/placeholder-foreground\/40/g, "placeholder-ink-3"],
  // Plain text-foreground last (after the slashed variants)
  [/\btext-foreground\b/g, "text-ink"],

  // Brand hex -> tokens
  [/text-\[#2E86DE\]/g, "text-ocean"],
  [/hover:text-\[#2E86DE\]/g, "hover:text-ocean"],
  [/bg-\[#2E86DE\]\/10/g, "bg-ocean/10"],
  [/bg-\[#2E86DE\]\/15/g, "bg-ocean/15"],
  [/bg-\[#2E86DE\]\/20/g, "bg-ocean/20"],
  [/bg-\[#2E86DE\]\/25/g, "bg-ocean/25"],
  [/bg-\[#2E86DE\]\/30/g, "bg-ocean/30"],
  [/hover:bg-\[#2E86DE\]\/10/g, "hover:bg-ocean/10"],
  [/hover:bg-\[#2E86DE\]\/20/g, "hover:bg-ocean/20"],
  [/hover:bg-\[#2E86DE\]/g, "hover:bg-ocean"],
  [/bg-\[#2E86DE\]/g, "bg-ocean"],
  [/border-\[#2E86DE\]/g, "border-ocean"],
  [/ring-\[#2E86DE\]/g, "ring-ocean"],
  [/from-\[#2E86DE\]/g, "from-ocean"],
  [/to-\[#2E86DE\]/g, "to-ocean"],
  [/via-\[#2E86DE\]/g, "via-ocean"],
  [/shadow-\[#2E86DE\]\/30/g, "shadow-ocean/30"],
  [/shadow-\[#2E86DE\]\/20/g, "shadow-ocean/20"],
  [/shadow-\[#2E86DE\]\/10/g, "shadow-ocean/10"],
  [/#2575C5/g, "var(--color-ocean-strong)"], // rare, leave inline as raw var

  [/text-\[#F39C12\]/g, "text-sunset"],
  [/hover:text-\[#F39C12\]/g, "hover:text-sunset"],
  [/bg-\[#F39C12\]\/10/g, "bg-sunset/10"],
  [/bg-\[#F39C12\]\/20/g, "bg-sunset/20"],
  [/bg-\[#F39C12\]\/30/g, "bg-sunset/30"],
  [/bg-\[#F39C12\]/g, "bg-sunset"],
  [/border-\[#F39C12\]/g, "border-sunset"],
  [/from-\[#F39C12\]/g, "from-sunset"],
  [/to-\[#F39C12\]/g, "to-sunset"],

  [/text-\[#1A1A2E\]/g, "text-ink"],
  [/bg-\[#1A1A2E\]/g, "bg-ink"],
  [/from-\[#1A1A2E\]/g, "from-ink"],
  [/to-\[#1A1A2E\]/g, "to-ink"],
  [/dark:from-\[#1A1A2E\]\/80/g, "dark:from-ink/80"],
];

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("usage: node scripts/token-sweep.mjs <file ...>");
  process.exit(2);
}

let totalChanges = 0;
for (const file of targets) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.warn(`skip (not found): ${file}`);
    continue;
  }
  let src = fs.readFileSync(abs, "utf8");
  const before = src;
  for (const [pat, replacement] of replacements) {
    if (typeof pat === "string") {
      src = src.split(pat).join(replacement);
    } else {
      src = src.replace(pat, replacement);
    }
  }
  if (src !== before) {
    const changed = before.split("\n").reduce((acc, line, i) => acc + (line === src.split("\n")[i] ? 0 : 1), 0);
    fs.writeFileSync(abs, src);
    console.log(`✓ ${file} (${changed} lines changed)`);
    totalChanges += changed;
  } else {
    console.log(`· ${file} (no changes)`);
  }
}
console.log(`\nTotal: ${totalChanges} lines across ${targets.length} files`);
