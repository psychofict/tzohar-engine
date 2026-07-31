// Generate the social-share card (og-image.jpg) by compositing the site's
// lockup onto the clean base photo with a soft drop shadow for legibility.
// Source of truth: public/images/og-base.jpg (the un-branded photo).
// Re-run after replacing the base photo or the lockup artwork.
// Usage: node scripts/gen-og-image.mjs
import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => resolve(root, ...s);
const IMG = p("public/images");

const BASE = `${IMG}/og-base.jpg`;
const LOGO = process.env.LOGO || `${IMG}/logo-lockup-white.png`;
const OUT = `${IMG}/og-image.jpg`;

const PAD = 48; // padding from the left & bottom edges
const LOGO_W = 240; // target logo width on the 1200x630 card (~native, stays crisp)

const { width: W, height: H } = await sharp(BASE).metadata();

// Resize the lockup to the target width.
const logo = await sharp(LOGO).resize({ width: LOGO_W }).png().toBuffer();
const { width: lw, height: lh } = await sharp(logo).metadata();

// Build a soft drop shadow from the logo's alpha (black, blurred, dimmed) so
// the white mark lifts off the photo regardless of what's behind it.
const shadowAlpha = await sharp(logo).extractChannel("alpha").blur(6).linear(0.55, 0).toBuffer();
const black = await sharp({
  create: { width: lw, height: lh, channels: 3, background: { r: 0, g: 0, b: 0 } },
}).png().toBuffer();
const shadow = await sharp(black).joinChannel(shadowAlpha).png().toBuffer();

const left = PAD;
const top = H - lh - PAD;

await sharp(BASE)
  .composite([
    { input: shadow, left: left + 3, top: top + 5 },
    { input: logo, left, top },
  ])
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(OUT);

console.log(`✓ ${OUT.replace(root + "/", "")}  (${W}x${H}, logo ${lw}x${lh} @ ${left},${top})`);
