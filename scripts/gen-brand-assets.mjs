// Generate all brand assets by extracting the REAL artwork from the
// brand sheet (a pure black/white design on solid backgrounds), then keying
// luminance -> alpha to produce clean transparent PNGs. App icons are the
// extracted white mark composited onto a neutral rounded square.
//
// Source sheet: ~/Downloads/ddd.jpeg (1536x1024). Re-run after replacing it.
// Usage: node scripts/gen-brand-assets.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => resolve(root, ...s);
const SRC = process.env.SHEET || resolve(process.env.HOME, "Downloads/ddd.jpeg");
const IMG = p("public/images");
mkdirSync(IMG, { recursive: true });

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));
const stretch = (g, lo, hi) => clamp(((g - lo) * 255) / (hi - lo));

// Extract pure B/W art on a solid bg -> transparent PNG (luminance as alpha).
async function extract(name, box, kind) {
  const { data, info } = await sharp(SRC)
    .extract({ left: box[0], top: box[1], width: box[2], height: box[3] })
    .grayscale().toColourspace("b-w").raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const g = data[i];
    const a = kind === "white" ? stretch(g, 45, 175) : stretch(255 - g, 70, 205);
    const c = kind === "white" ? 255 : 0;
    rgba[i * 4] = c; rgba[i * 4 + 1] = c; rgba[i * 4 + 2] = c; rgba[i * 4 + 3] = a;
  }
  const out = `${IMG}/brand-${name}.png`;
  await sharp(rgba, { raw: { width, height, channels: 4 } }).trim({ threshold: 12 }).png().toFile(out);
  console.log("✓", out.replace(root + "/", ""));
  return out;
}

// Calibrated boxes against the 1536x1024 sheet: [left, top, width, height]
const markWhite   = await extract("mark-white",    [40, 90, 360, 220], "white");
const markBlack   = await extract("mark-black",    [800, 90, 360, 220], "black");
await extract("lockup-white",  [240, 558, 280, 116], "white");
await extract("lockup-black",  [1000, 558, 292, 116], "black");
await extract("stacked-white", [40, 90, 360, 380], "white");
await extract("stacked-black", [800, 90, 360, 380], "black");

// App icon: white mark on a neutral near-black rounded square.
async function appIcon(out, size, { round = true } = {}) {
  const bg = round
    ? Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#0E0E10"/></svg>`)
    : Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#0E0E10"/></svg>`);
  const inner = Math.round(size * 0.64);
  const mark = await sharp(markWhite).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp(bg).composite([{ input: mark, gravity: "center" }]).png().toFile(out);
  console.log("✓", out.replace(root + "/", ""));
}
await appIcon(p("public/icon-512.png"), 512);
await appIcon(p("public/icon-192.png"), 192);
await appIcon(p("public/apple-touch-icon.png"), 180, { round: false });
await appIcon(p("public/favicon-512.png"), 512); // source for favicon.ico
console.log("done");
