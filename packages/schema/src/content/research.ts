import { z } from "zod";
import type { FormField } from "../config.form";

/**
 * Research module CONTENT — a generic academic profile: research interests,
 * publications (optionally live-sourced from ORCID, with a manual list as
 * fallback/supplement), and CV/portfolio document links. Distinct from the
 * `ai` module (a hand-authored, non-schema tech/founder vertical that predates
 * this) — `research` is the schema-driven, Studio-editable, generic-academic
 * analog.
 */

export const researchInterestSchema = z.object({
  label: z.string().min(1),
  icon: z.string().optional(),
});

export const publicationSchema = z.object({
  title: z.string().min(1),
  /**
   * Author list, in publication order, as displayed ("Jane A. Doe").
   *
   * Optional and added later than the rest: a publication list without authors
   * is legible for a personal site, but a BibTeX export without them is not a
   * citation, and a co-authored paper that lists only the site owner misleads.
   */
  authors: z.array(z.string()).optional(),
  journal: z.string().optional(),
  type: z.string().optional(),
  year: z.string().optional(),
  doi: z.string().optional(),
  url: z.string().optional(),
});

export const researchSchema = z.object({
  /** ORCID iD, e.g. "0000-0001-2345-6789". Powers the live Publications tab via /api/orcid-publications. */
  orcidId: z.string().optional(),
  interests: z.array(researchInterestSchema),
  /** Manually-entered publications — shown alongside (or instead of, if no ORCID id) the live feed. */
  publications: z.array(publicationSchema),
  cvUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
});

export type ResearchInterest = z.infer<typeof researchInterestSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type ResearchContent = z.infer<typeof researchSchema>;

export const researchInterestFields: readonly FormField[] = [
  { key: "label", label: "Research area", widget: "text", required: true, group: "Interest" },
  { key: "icon", label: "Icon", widget: "text", group: "Interest" },
] as const;

export const publicationFields: readonly FormField[] = [
  { key: "title", label: "Title", widget: "text", required: true, group: "Publication" },
  { key: "journal", label: "Journal", widget: "text", group: "Publication" },
  { key: "type", label: "Type", widget: "text", group: "Publication", help: "e.g. Journal Article, Conference Paper." },
  { key: "year", label: "Published", widget: "text", group: "Publication" },
  { key: "doi", label: "DOI", widget: "text", group: "Publication" },
  { key: "url", label: "Link", widget: "url", group: "Publication" },
] as const;
