/**
 * Small text contrast in the header and footer (audit item E13, 24 Nov 2026).
 *
 * On the Kopje Light demo (rose accent, sand paper) the footer's credit line measured 3.27:1
 * (`text-ink-3/80`) and the header's outline button 3.93:1 (`text-ocean`); text that small needs
 * 4.5:1. The credit line is `text-ink-2` now, and the button's text is `text-accent-ink`, the
 * accent mixed 80/20 with the ink in oklab, as globals.css defines it. This works the colours out
 * for every theme preset on every paper, in both modes, plus a few picked accents.
 *
 * Run: npx --yes tsx scripts/contrast.test.ts
 */
import { readFileSync } from "node:fs";
import { PAPER_CHOICES, THEME_PRESETS, resolveTheme } from "../packages/schema/src/theme";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
/** The source with its comments taken out (they quote the old classes). */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

// ── colour arithmetic ────────────────────────────────────────────────────
type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp = (c: number) => Math.min(1, Math.max(0, c));

function toOklab([r, g, b]: RGB): RGB {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function fromOklab([L, a, b]: RGB): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => clamp(fromLinear(c))) as RGB;
}
/** CSS `color-mix(in oklab, a p%, b)`. */
function mixOklab(a: string, b: string, p: number): RGB {
  const [x, y] = [toOklab(hex(a)), toOklab(hex(b))];
  return fromOklab([0, 1, 2].map((i) => x[i] * p + y[i] * (1 - p)) as RGB);
}
const luminance = (rgb: RGB) => {
  const [r, g, b] = rgb.map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: RGB, b: RGB) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// ── the source says what is measured here ────────────────────────────────
console.log("the classes");
const css = read("src/app/globals.css");
const nav = code("src/components/Navbar.tsx");
const footer = code("src/components/Footer.tsx");
const mix = /--color-accent-ink:\s*color-mix\(in oklab, var\(--color-ocean-strong\) (\d+)%, var\(--color-ink\)\)/.exec(css);
check("globals.css defines the accent ink as a mix of the strong accent and the ink", !!mix);
check("it is defined inline, so each element resolves it against its own theme", /@theme inline\s*\{[^}]*--color-accent-ink/.test(css));
check("the header's outline button uses it", /border-ocean text-accent-ink/.test(nav));
check("the header no longer sets small accent text in the raw accent", !/["\s]text-ocean["\s]/.test(nav));
check("the footer credit line is ink-2 at full strength", /<p className="text-\[11px\] text-ink-2 text-center/.test(footer) && !/text-ink-3\/80/.test(footer));

// ── the numbers ──────────────────────────────────────────────────────────
const share = mix ? Number(mix[1]) / 100 : 0.8;
const configs = [
  ...Object.keys(THEME_PRESETS).map((theme) => ({ label: theme, config: { theme } })),
  ...["#C9A227", "#E8B4B8", "#00A86B", "#FFD400"].map((accent) => ({ label: `accent ${accent}`, config: { appearance: { accent } } })),
];
let worstButton = { r: Infinity, at: "" };
let worstCredit = { r: Infinity, at: "" };
for (const { label, config } of configs) {
  for (const paper of PAPER_CHOICES) {
    for (const mode of ["light", "dark"] as const) {
      const t = resolveTheme({ ...config, appearance: { ...(config as { appearance?: object }).appearance, paper } } as never, mode);
      const button = ratio(mixOklab(t.primaryStrong, t.ink, share), hex(t.bg));
      if (button < worstButton.r) worstButton = { r: button, at: `${label}, ${paper} paper, ${mode}` };
      const credit = ratio(hex(t.ink2), hex(t.surface2));
      if (credit < worstCredit.r) worstCredit = { r: credit, at: `${paper} paper, ${mode}` };
    }
  }
}
console.log("contrast on every preset and paper");
check(`the header button text clears 4.5:1 (worst ${worstButton.r.toFixed(2)}, ${worstButton.at})`, worstButton.r >= 4.5);
check(`the footer credit line clears 4.5:1 (worst ${worstCredit.r.toFixed(2)}, ${worstCredit.at})`, worstCredit.r >= 4.5);
const demo = resolveTheme({ theme: "rose", appearance: { paper: "sand" } } as never, "light");
check("control: the raw rose accent on sand fails, as measured on the demo", ratio(hex(demo.primary), hex(demo.bg)) < 4.5);

if (fails) {
  console.error(`\n${fails} check${fails === 1 ? "" : "s"} failed`);
  process.exit(1);
}
console.log("\nall checks passed");
