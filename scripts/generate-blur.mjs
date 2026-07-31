#!/usr/bin/env node
/**
 * Generate LQIP blur placeholders for every photograph the site actually
 * uses — gallery items, release covers, the home hero — so `next/image` can
 * ship `placeholder="blur"` instead of a hard pop-in. Output is one lookup
 * map (`src/data/image-blur.json`, path → base64 data URI) so any component
 * can ask for a blur without per-field schema plumbing.
 *
 * Run after adding/replacing photos:  npm run generate-blur
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir = join(root, "public");
const outPath = join(root, "src/data/image-blur.json");

// Directories under public/images that are exclusively photographs (as
// opposed to logos/icons/vector marks, which don't need a blur placeholder).
// Every image directory under public/ — a per-site list would need editing per client.
const PHOTO_DIRS = (process.env.PHOTO_DIRS || "images,video").split(",");

// Intrinsic pixel dimensions, keyed the same way as the blur map. The lightbox
// needs a real width/height per frame to size the `next/image` it opens, and a
// composed page only ever names a path — so the sizes are collected here rather
// than hand-copied into content JSON where they would silently go stale.
const sizeOutPath = join(root, "src/data/image-size.json");

function readJson(relPath) {
  const p = join(root, relPath);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf-8"));
}

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) walk(abs, out);
    else out.push(abs);
  }
}

/** Collect every /images/... path the config + content JSON reference, plus every file in the known photo directories. */
function collectImagePaths() {
  const paths = new Set();

  const site = readJson("src/config/site.values.json");
  if (site?.brand?.heroImage) paths.add(site.brand.heroImage);
  if (site?.brand?.ogImage) paths.add(site.brand.ogImage);

  const gallery = readJson("src/data/gallery.json");
  for (const item of gallery?.items ?? []) if (item.src) paths.add(item.src);

  const releases = readJson("src/data/releases.json");
  for (const r of releases?.releases ?? []) if (r.coverImage) paths.add(r.coverImage);

  /*
   * Composed pages + the module content files reference images from arbitrary
   * depths (a hero background, a gallery item, a masterDetail thumb, a nested
   * tab's card). Rather than enumerate every field — which drifts every time a
   * block type gains one — walk the JSON and take any string that looks like an
   * image path under /images.
   */
  for (const file of ["src/data/pages.json", "src/data/engagements.json", "src/data/innovation.json", "src/data/biography.json"]) {
    const doc = readJson(file);
    if (!doc) continue;
    const visit = (node) => {
      if (typeof node === "string") {
        if (/^\/images\/.+\.(jpe?g|png|webp)$/i.test(node)) paths.add(node);
      } else if (Array.isArray(node)) node.forEach(visit);
      else if (node && typeof node === "object") Object.values(node).forEach(visit);
    };
    visit(doc);
  }

  for (const dir of PHOTO_DIRS) {
    const abs = join(root, "public", dir);
    if (!existsSync(abs)) continue;
    const files = [];
    walk(abs, files);
    for (const f of files) paths.add("/" + f.slice(join(root, "public").length + 1));
  }

  return [...paths].filter((p) => /\.(jpe?g|png|webp)$/i.test(p));
}

async function intrinsicSize(absPath) {
  // `rotate()` first so a phone photo carrying EXIF orientation 6 reports the
  // dimensions it will actually render at, not its stored (swapped) ones.
  const { width, height } = await sharp(absPath).rotate().metadata();
  return { w: width ?? 0, h: height ?? 0 };
}

async function blurDataUrl(absPath) {
  const buf = await sharp(absPath)
    .resize(16, 16, { fit: "inside" })
    .jpeg({ quality: 40 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function main() {
  const paths = collectImagePaths();
  const existing = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf-8")) : {};
  const existingSizes = existsSync(sizeOutPath) ? JSON.parse(readFileSync(sizeOutPath, "utf-8")) : {};
  const out = {};
  const sizes = {};
  let generated = 0;
  let skippedMissing = 0;

  for (const src of paths) {
    const absPath = join(publicDir, src.replace(/^\//, ""));
    if (!existsSync(absPath)) {
      skippedMissing++;
      continue;
    }
    sizes[src] = existingSizes[src] ?? (await intrinsicSize(absPath));
    if (existing[src]) {
      out[src] = existing[src];
      continue;
    }
    out[src] = await blurDataUrl(absPath);
    generated++;
  }

  writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
  writeFileSync(sizeOutPath, JSON.stringify(sizes, null, 2) + "\n");
  console.log(
    `generate-blur: ${Object.keys(out).length} placeholders (${generated} new, ` +
      `${Object.keys(out).length - generated} cached${skippedMissing ? `, ${skippedMissing} source files missing` : ""}) → ${outPath.replace(root + "/", "")}`,
  );
  console.log(`generate-blur: ${Object.keys(sizes).length} intrinsic sizes → ${sizeOutPath.replace(root + "/", "")}`);
}

main().catch((err) => {
  console.error("generate-blur failed:", err);
  process.exit(1);
});
