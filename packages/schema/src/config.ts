import { z } from "zod";
import {
  FONT_CHOICES,
  RADIUS_CHOICES,
  MODE_CHOICES,
  PAPER_CHOICES,
  TYPESCALE_CHOICES,
  MOTION_CHOICES,
  HEX_RE,
} from "./theme";

/**
 * @tzohar/schema — the SHARED contract for a Tzohar Sites build's identity config.
 *
 * This package is the single source of truth, consumed three ways:
 *   1. the engine validates `site.values.json` against `configSchema` at load,
 *   2. Tzohar Studio generates its editor forms from it (Phase 2),
 *   3. Studio's serializer validates before committing the JSON artifact.
 *
 * It is a LEAF: it imports nothing from the engine. The engine's types
 * (`src/config/site.ts`) are re-exported FROM here, so there is one definition.
 */

export const KINDS = ["person", "musician", "creator", "business"] as const;
export const THEMES = ["default", "violet", "emerald", "sunset", "rose", "slate"] as const;
export const LOCALES = ["en", "ko", "zh", "fr", "ja"] as const;
export const MODULES = [
  "music",
  "label",
  "ai",
  "influencer",
  "tour",
  "gallery",
  "vault",
  "merch",
  "membership",
  "press",
  "links",
  "research",
  "innovation",
  "engagements",
  "biography",
  "pages",
  "posts",
  "crm",
] as const;

export const kindSchema = z.enum(KINDS);
export const themeSchema = z.enum(THEMES);
export const localeSchema = z.enum(LOCALES);
export const moduleSchema = z.enum(MODULES);

const hex = z.string().regex(HEX_RE, "Use a 6-digit hex color like #6E48E5");

/**
 * Optional appearance overrides — the "real customization" layer on top of the
 * named `theme` preset. All fields optional so a preset-only site is unchanged.
 * The engine + Studio preview both interpret this via `@tzohar/schema`'s theme
 * module (single source of truth for colors/fonts/shape).
 */
export const appearanceSchema = z.object({
  /** Custom primary accent (overrides the preset's). */
  accent: hex.optional(),
  /** Custom secondary accent (falls back to the preset's secondary). */
  accentSecondary: hex.optional(),
  /** Curated font pairing. */
  font: z.enum(FONT_CHOICES).optional(),
  /** Neutral palette ("paper"): surfaces + ink. `tinted` derives from the accent. */
  paper: z.enum(PAPER_CHOICES).optional(),
  /** How loud the display type is sitewide. */
  typeScale: z.enum(TYPESCALE_CHOICES).optional(),
  /** The site's signature motion vocabulary (scroll reveals + hero entrance). */
  motion: z.enum(MOTION_CHOICES).optional(),
  /** Corner radius scale. */
  radius: z.enum(RADIUS_CHOICES).optional(),
  /** Default color mode for visitors. `system` follows the OS. */
  mode: z.enum(MODE_CHOICES).optional(),
});

// ── Layout — structural variation, not just color/type ─────────────────────
export const HERO_CHOICES = ["photo", "split", "type", "portrait"] as const;
export const SECTION_STYLE_CHOICES = ["cards", "editorial"] as const;
export const HERO_TONE_CHOICES = ["auto", "dark"] as const;

/**
 * Per-site layout selections. `hero` picks the home hero's art direction;
 * `sections` picks how the home's role panels + stats render (soft cards vs
 * hairline editorial rows). `heroTone` art-directs page/home heroes onto a
 * DARK band while the rest of the page keeps the site's (typically light) mode
 * — the "dark hero, light body" editorial look — via the `.section-invert`
 * scope in the engine (globals.css). "auto" (default) = heroes follow the
 * global mode. All optional — defaults preserve the classic look.
 */
export const layoutSchema = z.object({
  hero: z.enum(HERO_CHOICES).optional(),
  sections: z.enum(SECTION_STYLE_CHOICES).optional(),
  heroTone: z.enum(HERO_TONE_CHOICES).optional(),
});

// ── Contact — which inquiry forms this site offers ─────────────────────────
export const INQUIRY_CHOICES = [
  "booking",
  "speaking",
  "press",
  "collaborations",
  "research",
  "labelSubmissions",
  "general",
] as const;

/**
 * The contact page's tab strip. This used to be a `const tabKeys` in the
 * component, which meant serving an academic client involved editing the
 * engine — a musician needs Booking + Demo submissions, a researcher needs
 * Speaking + Research collaboration, and both were being got by forking.
 * The engine ships every form; config chooses which appear and in what order.
 */
export const contactSchema = z.object({
  inquiries: z.array(z.enum(INQUIRY_CHOICES)).min(1).optional(),
});

// ── Person — the schema.org facts behind the JSON-LD ───────────────────────
/**
 * Rich schema.org Person/Organization facts. These were hardcoded per client in
 * `src/lib/structured-data.ts`, which is the single worst place for them: it is
 * engine code, so every build carried the previous client's biography until
 * somebody remembered to rewrite it. Everything here is optional — a site that
 * sets none still emits a valid Person built from `name`/`description`/socials.
 */
export const personSchema = z.object({
  givenName: z.string().optional(),
  familyName: z.string().optional(),
  /** ISO date, e.g. "2001-11-29". */
  birthDate: z.string().optional(),
  birthPlace: z
    .object({ name: z.string(), locality: z.string().optional(), country: z.string().optional() })
    .optional(),
  /** Short caption for the primary image in JSON-LD. */
  imageCaption: z.string().optional(),
  /** A longer schema.org-only description; falls back to `site.description`. */
  description: z.string().optional(),
  jobTitles: z.array(z.string()).optional(),
  occupations: z
    .array(z.object({ name: z.string(), location: z.string().optional(), description: z.string().optional() }))
    .optional(),
  worksFor: z
    .array(z.object({ name: z.string(), url: z.string().optional(), description: z.string().optional() }))
    .optional(),
  alumniOf: z.array(z.object({ name: z.string(), url: z.string().optional() })).optional(),
  credentials: z
    .array(
      z.object({
        name: z.string(),
        category: z.string().optional(),
        level: z.string().optional(),
        institution: z.string().optional(),
      }),
    )
    .optional(),
  awards: z.array(z.string()).optional(),
  memberOf: z
    .array(z.object({ name: z.string(), description: z.string().optional(), roleName: z.string().optional() }))
    .optional(),
  knowsAbout: z.array(z.string()).optional(),
  knowsLanguage: z.array(z.string()).optional(),
  /** Notable events (schema.org performerIn). */
  events: z
    .array(z.object({ name: z.string(), startDate: z.string().optional(), location: z.string().optional() }))
    .optional(),
});

// ── CRM — the client-facing CMS this site serves at /admin ─────────────────
/**
 * The client's own content surface. Off by default: it is a real login on a
 * public host, so it must be an explicit decision rather than something every
 * generated site silently exposes. Credentials never live here — they are
 * environment variables on the deployment (see docs/crm.md); this only decides
 * whether the routes exist and what they can reach.
 */
export const crmSchema = z.object({
  /** Extra `public/` directories to expose in the media library, beyond uploads. */
  mediaDirs: z
    .array(z.object({ dir: z.string().min(1), label: z.string().min(1), note: z.string().optional() }))
    .optional(),
  /** Shown on the CRM dashboard — who to contact when something needs a developer. */
  supportEmail: z.email().optional(),
});

export const socialLinkSchema = z.object({
  name: z.string().min(1),
  url: z.url(),
  /** key into the social icon map (src/components/ui/SocialIcons) */
  icon: z.string().min(1),
});

/** The identity values for one site — mirrors `SiteConfig` exactly. */
export const configSchema = z.object({
  /** Public brand name — shown across the site and in page titles. */
  name: z.string().min(1),
  /** Full / legal name — schema.org + copyright. */
  legalName: z.string().optional(),
  /** Other names, handles, or scripts (schema.org alternateName). */
  alternateNames: z.array(z.string()).optional(),
  /** Primary identity — drives default schema @type and copy tone. */
  kind: kindSchema,
  /** Short tagline / motto. */
  tagline: z.string(),
  /** SEO + social description (~150–160 chars). */
  description: z.string(),
  /** Production origin, no trailing slash. e.g. "https://example.com". */
  url: z.url(),
  /** Public contact email. */
  email: z.email(),
  /** Where they're based / from — footer + schema. */
  location: z.object({ based: z.string().optional(), from: z.string().optional() }).optional(),
  /** Geo meta for local SEO. `region` = ISO-3166-2 code. */
  geo: z.object({ region: z.string().optional(), placename: z.string().optional() }).optional(),
  /** Brand assets, as paths under /public. */
  brand: z.object({
    logoLight: z.string().min(1),
    logoDark: z.string().min(1),
    ogImage: z.string().min(1),
    /** Home hero image (photo/split/portrait heroes). Falls back per-hero. */
    heroImage: z.string().min(1).optional(),
    /**
     * Brighter plate for LIGHT mode on core-route photo heroes (contact, about…).
     *
     * Without one, those heroes force a dark band onto a light page — which is
     * how a light-theme site ended up opening its contact page on a near-black
     * slab. A dark studio portrait cannot be rescued by a white wash (lightening
     * a photo pushes it into the values ink occupies), so this names a genuinely
     * bright frame instead. Optional: a photo that already reads bright in both
     * modes needs no counterpart.
     */
    heroImageLight: z.string().min(1).optional(),
    /** Focal point of the hero image in percent (0–100), for art-directed crops. */
    heroFocal: z
      .object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) })
      .optional(),
  }),
  /** Accent color preset (see globals.css THEME PRESETS). Defaults to "default". */
  theme: themeSchema.optional(),
  /** Fine-grained appearance overrides (accent, font, paper, type scale, motion, radius, mode). */
  appearance: appearanceSchema.optional(),
  /** Structural layout selections (home hero art direction, section style). */
  layout: layoutSchema.optional(),
  /** Languages this site ships. */
  locales: z.object({ default: localeSchema, enabled: z.array(localeSchema).min(1) }),
  /** SEO. `titleDefault` is the homepage <title>; other pages use the template. */
  seo: z.object({ titleDefault: z.string(), keywords: z.array(z.string()).optional() }),
  /** @handle for X/Twitter cards (include the @). */
  twitter: z.string().optional(),
  /** Social links — also feed schema.org sameAs. */
  socials: z.array(socialLinkSchema),
  /** Extra schema.org sameAs profile URLs beyond `socials` (SEO only). */
  sameAs: z.array(z.url()).optional(),
  /** Sections switched on for this site. */
  modules: z.array(moduleSchema),
  /** Which inquiry forms the contact page offers. */
  contact: contactSchema.optional(),
  /** schema.org Person/Organization facts (JSON-LD). */
  person: personSchema.optional(),
  /** The client-facing CMS at /admin (also needs the `crm` module enabled). */
  crm: crmSchema.optional(),
});

// ── Canonical types — the engine re-exports these from src/config/site.ts ──
export type SiteConfig = z.infer<typeof configSchema>;
export type SiteModule = z.infer<typeof moduleSchema>;
export type ThemePreset = z.infer<typeof themeSchema>;
export type Locale = z.infer<typeof localeSchema>;
export type SiteKind = z.infer<typeof kindSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;
export type Appearance = z.infer<typeof appearanceSchema>;
export type SiteContact = z.infer<typeof contactSchema>;
export type SitePerson = z.infer<typeof personSchema>;
export type SiteCrm = z.infer<typeof crmSchema>;
export type InquiryChoice = (typeof INQUIRY_CHOICES)[number];
export type SiteLayout = z.infer<typeof layoutSchema>;
export type HeroChoice = (typeof HERO_CHOICES)[number];
export type SectionStyleChoice = (typeof SECTION_STYLE_CHOICES)[number];
