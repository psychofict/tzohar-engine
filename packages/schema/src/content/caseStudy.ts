import { z } from "zod";
import type { FormField } from "../config.form";

/**
 * Case-study CONTENT — the shared shape behind both the `innovation` module
 * (category grid → project list → sticky-sidebar detail) and the
 * `engagements` module (category tabs → chronological list → stacked-prose
 * detail). They differ only in which layout renders the list/detail, not in
 * the data: a client-configured set of categories, and entries with a
 * client-named set of body sections (e.g. "Scope/Challenge/Solution/Impact"
 * for a project, or "Scope/Approach/Impact" for an engagement).
 *
 * Unlike `GALLERY_CATEGORIES` (a dev-time enum), categories here are CLIENT
 * data — so an entry's `category` is validated against the sibling
 * `categories[]` list via `superRefine`, not a compile-time z.enum.
 */

export const caseStudyCategorySchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().optional(),
});

export const caseStudySectionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  body: z.string(),
  /** Lucide icon name, e.g. "FileText" — falls back to a numbered badge if unset. */
  icon: z.string().optional(),
});

export const caseStudyMediaSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().optional(),
});

export const caseStudyEntrySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  /** Must match a `key` in the parent `caseStudySchema.categories`. */
  category: z.string().min(1),
  summary: z.string(),
  heroImage: z.string().min(1),
  heroVideo: z.string().optional(),
  /** Free-text date (e.g. "May 12, 2024") — engagements show it, projects usually don't. */
  date: z.string().optional(),
  location: z.string().optional(),
  sections: z.array(caseStudySectionSchema),
  media: z.array(caseStudyMediaSchema).optional(),
});

export const caseStudySchema = z
  .object({
    categories: z.array(caseStudyCategorySchema),
    entries: z.array(caseStudyEntrySchema),
  })
  .superRefine((val, ctx) => {
    const keys = new Set(val.categories.map((c) => c.key));
    val.entries.forEach((e, i) => {
      if (!keys.has(e.category)) {
        ctx.addIssue({
          code: "custom",
          path: ["entries", i, "category"],
          message: `"${e.category}" isn't one of the configured categories.`,
        });
      }
    });
  });

export type CaseStudyCategory = z.infer<typeof caseStudyCategorySchema>;
export type CaseStudySection = z.infer<typeof caseStudySectionSchema>;
export type CaseStudyMedia = z.infer<typeof caseStudyMediaSchema>;
export type CaseStudyEntry = z.infer<typeof caseStudyEntrySchema>;
export type CaseStudyContent = z.infer<typeof caseStudySchema>;

/** Studio editor descriptor for one category (repeatable rows). */
export const caseStudyCategoryFields: readonly FormField[] = [
  { key: "key", label: "Key", widget: "text", required: true, group: "Category", help: "Short slug, e.g. \"science\". Matches an entry's category." },
  { key: "label", label: "Label", widget: "text", required: true, group: "Category" },
  { key: "icon", label: "Icon", widget: "text", group: "Category" },
] as const;

/** Studio editor descriptor for one entry's top-level fields (sections/media edited via nested rows). */
export const caseStudyEntryFields: readonly FormField[] = [
  { key: "title", label: "Title", widget: "text", required: true, group: "Entry" },
  { key: "slug", label: "Slug", widget: "text", required: true, group: "Entry" },
  { key: "category", label: "Category", widget: "select", required: true, group: "Entry" },
  { key: "summary", label: "Summary", widget: "textarea", group: "Entry" },
  { key: "heroImage", label: "Hero image", widget: "image", required: true, group: "Entry" },
  { key: "heroVideo", label: "Hero video URL", widget: "url", group: "Entry" },
  { key: "date", label: "Date", widget: "text", group: "Entry", help: "Free text, e.g. \"May 12, 2024\"." },
  { key: "location", label: "Location", widget: "text", group: "Entry" },
] as const;

/** Studio editor descriptor for one section within an entry (nested repeatable rows). */
export const caseStudySectionFields: readonly FormField[] = [
  { key: "label", label: "Section label", widget: "text", required: true, group: "Section", help: "e.g. \"The Challenge\"." },
  { key: "body", label: "Body", widget: "textarea", required: true, group: "Section" },
  { key: "icon", label: "Icon", widget: "text", group: "Section", help: "Lucide icon name, e.g. \"FileText\". Optional." },
] as const;
