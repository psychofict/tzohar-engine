// Curated fan-facing visual hub. Photos are grouped into filterable
// categories; the lightbox and masonry use the baked-in intrinsic
// dimensions (no layout shift, no runtime probing).
//
// Captions are intentionally English proper-noun-led (places, events,
// releases) so they read correctly across all locales without translation.
//
// CONTENT now lives in ./gallery.json — the git-as-DB artifact Tzohar Studio
// edits and commits (see docs/studio.md). It is validated against the shared
// schema at load; the engine's exports below are unchanged.

import { gallerySchema, type GalleryCategory, type GalleryItem, type GalleryVideo } from "@tzohar/schema";
import raw from "./gallery.json";

const content = gallerySchema.parse(raw);

// Category order drives the filter chips. Labels are translated in messages
// under `gallery.cat.<key>`.
export const galleryCategories: GalleryCategory[] = content.categories;

export const galleryItems: GalleryItem[] = content.items;

// Drop YouTube video IDs into gallery.json to light up the Watch section.
// While empty, the page shows placeholder slots inviting content.
export const galleryVideos: GalleryVideo[] = content.videos;

export type { GalleryCategory, GalleryItem, GalleryVideo } from "@tzohar/schema";
