import { z } from "zod";

/**
 * The electronic press kit — content, not code.
 *
 * `press/page.tsx` held all of it as literals: a short bio naming the reference
 * build's owner, a six-row fact sheet with his real name and birthplace, four
 * captioned press photographs, four downloadable logo files and two streaming
 * links. Twenty-six lines, and the single largest concentration of one person's
 * identity left in engine code.
 *
 * It is also the module where getting this wrong is most expensive: a press page
 * exists to be quoted, and journalists copy the fact sheet verbatim.
 *
 * Every list defaults to empty and every section renders only when it has
 * content, so a client who enables `press` before writing one gets a page with a
 * hero and a contact button rather than someone else's biography.
 */
export const pressPhotoSchema = z.object({
  title: z.string().min(1),
  src: z.string().min(1),
  alt: z.string().min(1),
});

export const pressLogoSchema = z.object({
  label: z.string().min(1),
  src: z.string().min(1),
  /** "light" draws the tile on paper, "dark" on near-black — some marks need both. */
  on: z.enum(["light", "dark"]).default("light"),
});

export const pressFactSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const pressLinkSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  /** Brand colour for the pill; falls back to the site accent when absent. */
  color: z.string().optional(),
});

export const pressSchema = z.object({
  /** The paragraph a journalist is meant to paste. */
  shortBio: z.string().default(""),
  keyFacts: z.array(pressFactSchema).default([]),
  photos: z.array(pressPhotoSchema).default([]),
  logos: z.array(pressLogoSchema).default([]),
  streamingLinks: z.array(pressLinkSchema).default([]),
  /** Wide image behind the page hero. */
  heroImage: z.string().optional(),
  heroAlt: z.string().optional(),
  /**
   * Wide horizontal lockups for the download grid. Optional because most brands
   * only have the square mark; the page falls back to `brand.logoLight/logoDark`
   * rather than shipping the reference build's, which is what it used to do.
   */
  lockupLight: z.string().optional(),
  lockupDark: z.string().optional(),
});

export type PressPhoto = z.infer<typeof pressPhotoSchema>;
export type PressLogo = z.infer<typeof pressLogoSchema>;
export type PressFact = z.infer<typeof pressFactSchema>;
export type PressLink = z.infer<typeof pressLinkSchema>;
export type PressContent = z.infer<typeof pressSchema>;
