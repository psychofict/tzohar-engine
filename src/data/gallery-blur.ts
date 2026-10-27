// Blur placeholders for photos only the members-only gallery shows, written by
// `npm run generate-blur` (scripts/split-gallery-blur.mjs). Read on the server only: the map in
// image-blur.json reaches the browser on every page, so these paths stay out of it (TZS-2,
// EBE-6325). Never import this into a "use client" file.
import raw from "./gallery-blur.json";

const map = raw as Record<string, string>;

export function galleryBlurDataURL(src: string): string | undefined {
  return map[src];
}
