import { z } from "zod";
import type { FormField } from "../config.form";

/**
 * Gallery module CONTENT — proves that per-module content (not just identity)
 * flows through the same git-as-DB pipeline: the engine validates
 * src/data/gallery.json against this; Studio generates an array editor from
 * `galleryItemFields` and serializes back to that JSON on publish.
 */

export const GALLERY_CATEGORIES = ["stage", "travel", "milestones", "music"] as const;
export const galleryCategoryEnum = z.enum(GALLERY_CATEGORIES);

export const galleryItemSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  category: galleryCategoryEnum,
  w: z.number().int().positive(),
  h: z.number().int().positive(),
});

export const galleryVideoSchema = z.object({
  youtubeId: z.string().min(1),
  title: z.string().min(1),
});

export const gallerySchema = z.object({
  categories: z.array(galleryCategoryEnum),
  items: z.array(galleryItemSchema),
  videos: z.array(galleryVideoSchema),
});

export type GalleryCategory = z.infer<typeof galleryCategoryEnum>;
export type GalleryItem = z.infer<typeof galleryItemSchema>;
export type GalleryVideo = z.infer<typeof galleryVideoSchema>;
export type GalleryContent = z.infer<typeof gallerySchema>;

/** Studio editor descriptor for one gallery item (repeatable rows). */
export const galleryItemFields: readonly FormField[] = [
  { key: "src", label: "Image path", widget: "image", required: true, group: "Item" },
  { key: "alt", label: "Caption", widget: "text", required: true, group: "Item" },
  { key: "category", label: "Category", widget: "select", options: GALLERY_CATEGORIES, required: true, group: "Item" },
  { key: "w", label: "Width", widget: "number", required: true, group: "Item" },
  { key: "h", label: "Height", widget: "number", required: true, group: "Item" },
] as const;
