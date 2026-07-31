import { site } from "@/config/site";
import { artistContentSchema, aiProfileSchema } from "@tzohar/schema";
import raw from "./artist.json";

/**
 * Loader for the music / ai / links / influencer modules' data.
 *
 * This file used to BE the data: 500 lines of one artist's discography, government
 * roles, brand partnerships and academic record, sitting in engine-owned space. So
 * every client repo carried another person's career, and a client who actually ran
 * those modules inherited it until they overwrote it by hand. 174 of those lines
 * were exports nothing imported at all.
 *
 * Now it is content (`artist.json`, client-owned) behind a validated loader, like
 * every other artifact in this directory. The reference build keeps its own data in
 * its own repo; the template ships an empty starter, so a newly generated site
 * begins blank rather than as somebody else.
 *
 * Empty is valid — a site can enable the music module before it has any releases.
 */
const parsed = artistContentSchema.parse(raw);

export const artist = parsed.profile ?? { name: site.name, bio: "", genres: [] };
export const albums = parsed.albums;
export const topTracks = parsed.topTracks;
export const timeline = parsed.timeline;
export const macroInfluencer = parsed.macroInfluencer;
export const brandPartnerships = parsed.brandPartnerships;
export const eventAppearances = parsed.eventAppearances;
/**
 * Defaults to an empty CV rather than `undefined`: the AI page reads its sections
 * directly, and a site with the `ai` module but no CV yet should render empty
 * sections, not force a null-check into every consumer.
 */
export const aiProfile = parsed.aiProfile ?? aiProfileSchema.parse({});

/** Socials live in site config (single source of truth); re-exported for consumers. */
export const socials = site.socials;

/** Per-module hero photographs. Absent means the page falls back to a paper hero. */
export const heroes = parsed.heroes;
export const tourPosters = parsed.tourPosters;
