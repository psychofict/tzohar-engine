import { z } from "zod";

/**
 * Per-site data for the music / ai / links / influencer modules.
 *
 * It was a 500-line TypeScript literal at `src/data/artist.ts` — engine-owned, so
 * one artist's discography, government roles, brand partnerships and academic
 * record were part of the FRAMEWORK. Module pruning removes it from any client that
 * doesn't run those modules, but a client that DOES run them inherited someone
 * else's career until they overwrote it.
 *
 * Split like every other content artifact: JSON (client) + validated loader
 * (engine). The reference build keeps its own data in its own repo; the template
 * carries an empty starter, so a newly generated site begins blank.
 *
 * Everything is optional with empty defaults. A site can enable the music module
 * and have no releases yet without the build caring.
 */

export const artistProfileSchema = z.object({
  name: z.string().default(""),
  realName: z.string().optional(),
  from: z.string().optional(),
  basedIn: z.string().optional(),
  label: z.string().optional(),
  labelFounded: z.number().optional(),
  contact: z.string().optional(),
  tagline: z.string().optional(),
  bio: z.string().default(""),
  genres: z.array(z.string()).default([]),
  /** Year the act started — schema.org MusicGroup `foundingDate`. */
  activeSince: z.string().optional(),
  /** Lifetime streams as a plain integer string, for schema.org InteractionCounter. */
  streamCount: z.string().optional(),
});

export const albumSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number(),
  tracks: z.number().optional(),
  duration: z.string().optional(),
  /** Release format — drives the "EP"/"Album" label on the discography. */
  type: z.enum(["album", "ep", "single", "compilation"]),
  spotifyId: z.string().optional(),
  spotifyUrl: z.string().optional(),
  appleMusicUrl: z.string().optional(),
});

export const topTrackSchema = z.object({
  title: z.string(),
  /** Formatted for display ("254,155") rather than a number, as authored. */
  streams: z.string().optional(),
  source: z.string().optional(),
  spotifyUrl: z.string().optional(),
  albumId: z.string().optional(),
});

export const timelineEntrySchema = z.object({ year: z.number(), event: z.string() });
export const roleEntrySchema = z.object({ year: z.string(), org: z.string(), role: z.string() });
export const brandSchema = z.object({
  name: z.string(),
  category: z.string().default(""),
  logo: z.string().optional(),
});
/* `year` and `type` are defaulted rather than optional: the influencer page groups
   appearances by name and collects years into a `string[]`. */
export const eventAppearanceSchema = z.object({
  name: z.string(),
  year: z.string().default(""),
  type: z.string().default(""),
});

/**
 * The `ai` module's profile — an academic/engineering CV.
 *
 * Typed properly rather than left loose: the AI page reads `education.school`,
 * `publications[].venue`, `experience[].bullets` and so on, so a permissive
 * `passthrough()` would hand every one of those back as `unknown` and push the
 * casting into the page. Optional throughout, because no two CVs carry the same
 * sections.
 */
export const aiProfileSchema = z.object({
  title: z.string().optional(),
  bio: z.string().optional(),
  education: z
    .object({
      school: z.string().optional(),
      degree: z.string().optional(),
      years: z.string().optional(),
      scholarship: z.string().optional(),
      advisor: z.string().optional(),
      advisorUrl: z.string().optional(),
      labUrl: z.string().optional(),
      logo: z.string().optional(),
    })
    .default({}),
  /* Defaulted, not optional: the page reads these directly. */
  links: z.record(z.string(), z.string()).default({}),
  skills: z.array(z.object({ category: z.string(), icon: z.string().optional(), items: z.string() })).default([]),
  publications: z
    .array(
      z.object({
        title: z.string(),
        authors: z.array(z.string()).default([]),
        venue: z.string().optional(),
        description: z.string().optional(),
        projectPage: z.string().optional(),
        code: z.string().optional(),
        paper: z.string().optional(),
        image: z.string().optional(),
        featured: z.boolean().optional(),
      }),
    )
    .default([]),
  /* `category` is defaulted, not optional: the page groups projects by it and
     feeds the value into component state typed as `string`. */
  projects: z.array(z.object({ title: z.string(), category: z.string().default(""), url: z.string().optional() })).default([]),
  experience: z
    .array(
      z.object({
        role: z.string(),
        company: z.string().optional(),
        location: z.string().optional(),
        period: z.string().optional(),
        logo: z.string().optional(),
        url: z.string().optional(),
        current: z.boolean().optional(),
        bullets: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  certificates: z.array(z.object({ name: z.string(), org: z.string().optional(), logo: z.string().optional() })).default([]),
  /** Portrait beside the education section — was a hardcoded graduation photo. */
  portrait: z.string().optional(),
  portraitAlt: z.string().optional(),
});

export const heroImageSchema = z.object({
  image: z.string().min(1),
  alt: z.string().default(""),
});

export const tourPosterSchema = z.object({
  src: z.string().min(1),
  alt: z.string().default(""),
});

export const artistContentSchema = z.object({
  profile: artistProfileSchema.optional(),
  albums: z.array(albumSchema).default([]),
  topTracks: z.array(topTrackSchema).default([]),
  timeline: z.array(timelineEntrySchema).default([]),
  macroInfluencer: z.array(roleEntrySchema).default([]),
  brandPartnerships: z.array(brandSchema).default([]),
  eventAppearances: z.array(eventAppearanceSchema).default([]),
  aiProfile: aiProfileSchema.optional(),
  /**
   * The wide photograph behind each module page's title, keyed by module.
   *
   * These were `backgroundImage="/images/…"` literals in five page
   * components. `public/` is client-owned, so a client enabling `music` got a
   * hero pointing at a file that isn't in their repo — a 404 where the page's
   * whole first impression should be. Absent simply means a paper hero.
   */
  heroes: z
    .object({
      music: heroImageSchema.optional(),
      ai: heroImageSchema.optional(),
      tour: heroImageSchema.optional(),
      gallery: heroImageSchema.optional(),
      /** The round avatar at the top of the links page. */
      links: heroImageSchema.optional(),
    })
    .default({}),
  /** Poster art for past and upcoming runs, shown on the tour page. */
  tourPosters: z.array(tourPosterSchema).default([]),
});

export type ArtistContent = z.infer<typeof artistContentSchema>;
export type ArtistProfile = z.infer<typeof artistProfileSchema>;
export type Album = z.infer<typeof albumSchema>;
export type TopTrack = z.infer<typeof topTrackSchema>;
export type AiProfile = z.infer<typeof aiProfileSchema>;
