import { z } from "zod";
import { moduleSchema } from "../config";

/**
 * The default home page's content.
 *
 * `src/app/[locale]/page.tsx` used to hold all of this inline, so every client
 * generated from this engine shipped a home page advertising the reference build —
 * its streams, its partner logos, its magazine cover, its Instagram permalink, its
 * album on Spotify — behind links to modules the client had switched off, and
 * `<Image>` paths under `public/` that don't exist in a client repo, so the
 * pictures 404'd as well.
 *
 * It is content now: `src/data/home.json` (client-owned, per the `src/data/*.json`
 * rule) read through a validated loader (engine). Every field is optional and the
 * page skips whatever is absent, so `{}` is a valid home — which is what a client
 * who composes their own home page with the `pages` module should have.
 */

/** A headline number. `labelKey` resolves in the `home` messages namespace. */
export const homeStatSchema = z.object({
  value: z.string().min(1),
  labelKey: z.string().min(1),
});

export const homeLogoSchema = z.object({
  name: z.string().min(1),
  /** LOCAL path under `public/` — a remote host makes next/image 400. */
  src: z.string().min(1),
});

/**
 * A "where I operate" panel.
 *
 * `module` is load-bearing rather than decorative: the panel exists to link into
 * that module, so it is only rendered when the module is enabled. Three panels
 * pointing at 404s was the previous behaviour on every client build.
 */
export const homeRolePanelSchema = z.object({
  module: moduleSchema,
  href: z.string().min(1),
  titleKey: z.string().min(1),
  descKey: z.string().min(1),
  ctaKey: z.string().min(1),
  labelKey: z.string().min(1),
  image: z.string().min(1),
  /** Prefixed with the site name at render, so it needs no brand of its own. */
  imageAlt: z.string().min(1),
  icon: z.enum(["music", "research", "influence"]),
  accent: z.enum(["ocean", "sunset"]),
});

export const homeSpotlightSchema = z.object({
  module: moduleSchema,
  image: z.string().min(1),
  imageAlt: z.string().min(1),
  /** Outbound link for the picture (a post, an article). */
  href: z.string().min(1),
  /** In-site link for the call to action. */
  link: z.string().min(1),
});

export const homeReleaseSchema = z.object({
  module: moduleSchema,
  title: z.string().min(1),
  year: z.union([z.number(), z.string()]),
  artist: z.string().optional(),
  cover: z.string().min(1),
  listenUrl: z.string().min(1),
});

export const homeContentSchema = z.object({
  stats: z.array(homeStatSchema).optional(),
  logos: z.array(homeLogoSchema).optional(),
  panels: z.array(homeRolePanelSchema).optional(),
  spotlight: homeSpotlightSchema.nullish(),
  latestRelease: homeReleaseSchema.nullish(),
});

export type HomeContent = z.infer<typeof homeContentSchema>;
export type HomeStat = z.infer<typeof homeStatSchema>;
export type HomeLogo = z.infer<typeof homeLogoSchema>;
export type HomeRolePanel = z.infer<typeof homeRolePanelSchema>;
export type HomeSpotlight = z.infer<typeof homeSpotlightSchema>;
export type HomeRelease = z.infer<typeof homeReleaseSchema>;
