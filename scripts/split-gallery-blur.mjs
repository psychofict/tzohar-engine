/**
 * Keep the gallery's photos out of the blur map the browser gets (security review TZS-2,
 * EBE-6325, second review). `src/data/image-blur.json` is imported by client components
 * across the site, so every path in it ships in the site's scripts. A photo that appears only
 * in the members-only gallery moves to `src/data/gallery-blur.json`, which only the gallery's
 * server page reads (src/data/gallery-blur.ts). A gallery photo any other file under src/
 * names stays in the public map: it is shown outside the gallery anyway.
 *
 * The size map (`src/data/image-size.json`) ships to the browser the same way, so a gallery-only
 * photo is left out of it too; the gallery reads its sizes from gallery.json.
 *
 *   node scripts/split-gallery-blur.mjs          # re-split the committed maps; runs on prebuild
 *                                                # and predev, so a client repo's own maps are
 *                                                # split before every build
 *   (scripts/generate-blur.mjs calls writeBlurMaps() itself)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
export const PUBLIC_MAP = "src/data/image-blur.json";
export const GALLERY_MAP = "src/data/gallery-blur.json";
export const SIZE_MAP = "src/data/image-size.json";
const SKIP = new Set([PUBLIC_MAP, GALLERY_MAP, "src/data/gallery.json", "src/data/image-size.json"]);

const readJson = (rel) => (existsSync(join(root, rel)) ? JSON.parse(readFileSync(join(root, rel), "utf8")) : null);

function srcText() {
  const parts = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      if (statSync(abs).isDirectory()) walk(abs);
      else if (/\.(tsx?|jsx?|mjs|json|css)$/.test(name) && !SKIP.has(relative(root, abs))) parts.push(readFileSync(abs, "utf8"));
    }
  };
  walk(join(root, "src"));
  return parts.join("\n");
}

/** Photos only the gallery shows: in gallery.json and named by no other file under src/. */
export function galleryOnlyPaths() {
  const gallery = (readJson("src/data/gallery.json")?.items ?? []).map((i) => i.src).filter(Boolean);
  const text = srcText();
  return new Set(gallery.filter((src) => !text.includes(src)));
}

/** Splits one combined path -> value map into the public map and the gallery-only map. */
export function splitGalleryBlur(all, only = galleryOnlyPaths()) {
  const publicMap = {};
  const galleryMap = {};
  for (const [src, value] of Object.entries(all)) {
    if (only.has(src)) galleryMap[src] = value;
    else publicMap[src] = value;
  }
  return { publicMap, galleryMap };
}

const writeJson = (rel, obj) => {
  const next = JSON.stringify(obj, null, 2) + "\n";
  const abs = join(root, rel);
  // Unchanged files are left alone, so a build in a clean checkout leaves it clean.
  if (!existsSync(abs) || readFileSync(abs, "utf8") !== next) writeFileSync(abs, next);
};

/** Writes the blur maps and the browser's size map (gallery-only sizes left out). */
export function writeBlurMaps(allBlur, allSizes) {
  const only = galleryOnlyPaths();
  const { publicMap, galleryMap } = splitGalleryBlur(allBlur, only);
  // A map that does not exist and would be empty is not created, so a site without photos or
  // without the gallery gets no new files from a build.
  if (Object.keys(publicMap).length || existsSync(join(root, PUBLIC_MAP))) writeJson(PUBLIC_MAP, publicMap);
  if (Object.keys(galleryMap).length || existsSync(join(root, GALLERY_MAP)) || existsSync(join(root, "src/data/gallery-blur.ts")))
    writeJson(GALLERY_MAP, galleryMap);
  if (allSizes) writeJson(SIZE_MAP, splitGalleryBlur(allSizes, only).publicMap);
  return { publicCount: Object.keys(publicMap).length, galleryCount: Object.keys(galleryMap).length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!existsSync(join(root, "src/data/gallery.json"))) {
    console.log("split-gallery-blur: no gallery in this site, nothing to split");
    process.exit(0);
  }
  const all = { ...(readJson(PUBLIC_MAP) ?? {}), ...(readJson(GALLERY_MAP) ?? {}) };
  const { publicCount, galleryCount } = writeBlurMaps(all, readJson(SIZE_MAP) ?? undefined);
  console.log(`split-gallery-blur: ${publicCount} public placeholders, ${galleryCount} gallery-only → ${GALLERY_MAP}`);
}
