/**
 * The motion standard's guards (EBE-12569, company standard of 15 Nov 2026).
 *
 *   1. The locale layout wraps the site in <MotionProvider>, which is <MotionConfig reducedMotion="user">, so
 *      Framer Motion honours prefers-reduced-motion everywhere (it ignores it otherwise).
 *   2. No file under src/ writes a Framer exit as long as its entrance for the menus and dialogs: the
 *      navbar dropdown, drawer, accordion, lightbox and tabs each carry an exit shorter than the entrance.
 *   3. The Kinetic motion preset is described as expressive in the Studio picker (its curve overshoots).
 *   4. The press scale on shared buttons is 0.97.
 *   5. A PageHero's buttons use the theme-following variants: the fixed-white "-inverse" ones were unreadable on
 *      the paper hero of light mode (the music page's second button, 16 Nov 2026).
 *
 * Run: npx --yes tsx scripts/motion-standard.test.ts   (no network, reads source files)
 */
import { existsSync, readFileSync } from "node:fs";

let fails = 0;
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
  if (!ok) fails++;
};
const read = (p: string) => (existsSync(p) ? readFileSync(p, "utf8") : "");

const provider = read("src/components/MotionProvider.tsx");
check("MotionProvider is MotionConfig reducedMotion=\"user\"", /<MotionConfig reducedMotion="user">/.test(provider));
const layout = read("src/app/[locale]/layout.tsx");
check("the locale layout mounts MotionProvider", /<MotionProvider>/.test(layout) && /<\/MotionProvider>/.test(layout));

// An exit that has its own, shorter duration than the matching entrance.
for (const [file, label] of [
  ["src/components/Navbar.tsx", "navbar dropdown, accordion and drawer"],
  ["src/components/Lightbox.tsx", "lightbox"],
  ["src/components/ui/Tabs.tsx", "tabs"],
] as const) {
  const src = read(file);
  if (!src) {
    console.log(`skip ${label}: ${file} is not in this site`);
    continue;
  }
  const exits = [...src.matchAll(/exit=\{\{[^}]*transition:\s*\{\s*duration:\s*([0-9.]+)/g)].map((m) => parseFloat(m[1]));
  const enters = [...src.matchAll(/animate=\{\{[^}]*transition:\s*\{\s*duration:\s*([0-9.]+)/g)].map((m) => parseFloat(m[1]));
  const ok = exits.length > 0 && exits.length <= enters.length && exits.every((d, i) => d < enters[i]);
  check(`${label}: every exit is shorter than its entrance (${exits.join(", ")} < ${enters.join(", ")})`, ok);
}

const theme = read("packages/schema/src/theme.ts");
check("Kinetic is called expressive in the picker", /kinetic: \{[^}]*vibe: "Expressive/.test(theme));

const button = read("src/components/ui/Button.tsx");
check("shared buttons press to 0.97", /active:scale-\[0\.97\]/.test(button));

for (const f of ["src/app/[locale]/music/page.tsx", "src/app/[locale]/ai/page.tsx"]) {
  const src = read(f);
  if (!src) continue;
  check(`${f}: no fixed-white inverse button in a hero`, !/variant="(outline|ghost)-inverse"/.test(src));
}

if (fails) {
  console.error(`${fails} check(s) failed`);
  process.exit(1);
}
console.log("motion standard: all checks passed");
