#!/usr/bin/env node --experimental-strip-types
/**
 * Verifies the text/surface contrast invariants of the shared theme engine.
 *
 *   node --experimental-strip-types scripts/check-contrast.mjs
 *
 * Why this exists: the paper presets couple two things that are edited
 * independently. Every band tone (`base|muted|deep`, plus `elevated` cards) is a
 * legal ground for every ink token, so an ink token's real contrast is its
 * contrast against the *worst* surface in its mode — normally `surface2`, not
 * `bg`. Widening a preset's tonal ladder to make its bands visually separable
 * therefore spends the quiet ink tokens' contrast budget, and the failure is easy
 * to miss because it only shows up on the one band that uses the extreme tone
 * (here: the footer, which is `surface-2`).
 *
 * That is not hypothetical. Retuning `noir` for band separation pushed its
 * `ink3` to 4.11:1 on light `surface2` and 4.34:1 on dark `surface2` while both
 * still measured comfortably over 5:1 against `bg`.
 *
 * Reads the palettes straight from theme.ts, so there is no second copy of the
 * numbers to drift.
 */
import { PAPER_PRESETS, THEME_PRESETS, contrastRatio, readableOn } from "../packages/schema/src/theme.ts";

/** AA for normal-size text, plus a little margin so rounding can't flip it. */
const MIN_TEXT = 4.5;
const MARGIN = 0.05;
const SURFACES = ["bg", "surface", "surface2", "elevated"];
const INKS = ["ink", "ink2", "ink3"];

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  ✗ ${msg}`);
};

console.log("paper presets — every ink token against every surface tone");
for (const [name, preset] of Object.entries(PAPER_PRESETS)) {
  for (const mode of ["light", "dark"]) {
    const p = preset[mode];
    for (const ink of INKS) {
      let worst = Infinity;
      let worstOn = "";
      for (const s of SURFACES) {
        const r = contrastRatio(p[ink], p[s]);
        if (r < worst) [worst, worstOn] = [r, s];
      }
      const label = `${name}/${mode} ${ink} (${p[ink]})`;
      if (worst + MARGIN < MIN_TEXT) {
        fail(`${label}: ${worst.toFixed(2)}:1 on ${worstOn} (${p[worstOn]}) — needs ${MIN_TEXT}:1`);
      } else {
        console.log(`  ✓ ${label.padEnd(30)} ${worst.toFixed(2)}:1 (worst: ${worstOn})`);
      }
    }
  }
}

console.log("\nsurface ladders — adjacent band tones must be distinguishable");
// Two bands that differ by less than this read as one continuous surface, which
// is what made the dark noir page a single flat void with invisible section
// boundaries and card edges.
const MIN_STEP = 1.06;
for (const [name, preset] of Object.entries(PAPER_PRESETS)) {
  for (const mode of ["light", "dark"]) {
    const p = preset[mode];
    const steps = [
      ["bg→surface", contrastRatio(p.bg, p.surface)],
      ["surface→surface2", contrastRatio(p.surface, p.surface2)],
      ["bg→surface2", contrastRatio(p.bg, p.surface2)],
    ];
    for (const [pair, r] of steps) {
      const label = `${name}/${mode} ${pair}`;
      if (r < MIN_STEP) fail(`${label}: ${r.toFixed(3)}:1 — bands are visually identical`);
      else console.log(`  ✓ ${label.padEnd(34)} ${r.toFixed(3)}:1`);
    }
  }
}

console.log("\naccent presets — derived on-accent text must clear AA on its fill");
for (const [name, preset] of Object.entries(THEME_PRESETS)) {
  for (const mode of ["light", "dark"]) {
    for (const slot of ["primary", "secondary"]) {
      const fill = preset[mode][slot];
      const r = contrastRatio(readableOn(fill), fill);
      const label = `${name}/${mode} ${slot} (${fill})`;
      if (r + MARGIN < MIN_TEXT) fail(`${label}: on-accent text ${r.toFixed(2)}:1`);
      else console.log(`  ✓ ${label.padEnd(34)} ${r.toFixed(2)}:1`);
    }
  }
}

console.log(failures ? `\n${failures} contrast failure(s)` : "\nall contrast invariants hold");
process.exit(failures ? 1 : 0);
