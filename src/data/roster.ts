import { rosterContentSchema, type RosterArtist, type LabelIdentity } from "@tzohar/schema";
import { site } from "@/config/site";
import raw from "./roster.json";

/**
 * Loader for the label roster.
 *
 * The artists themselves used to be a literal array in this file, which made one
 * label's roster part of the ENGINE — so every client repo listed the reference
 * build's artists, and it could not be pruned with the `label` module because the
 * sitemap reads it from a core entrypoint. Now the names are content
 * (`roster.json`, client-owned) and only the loader is engine code.
 *
 * An empty roster is valid: a site with the label module and no artists yet simply
 * contributes no artist pages to the sitemap.
 */
const parsed = rosterContentSchema.parse(raw);

export type { RosterArtist, LabelIdentity };
export const rosterArtists: RosterArtist[] = parsed.artists;
export const rosterArtistIds = rosterArtists.map((a) => a.spotifyId);

/**
 * The label's own identity. `name` falls back to the site's, because a label page
 * titled with an empty string is worse than one titled after its founder — and a
 * client who has just enabled the module has filled in neither.
 */
export const label: LabelIdentity = parsed.label;
export const labelName: string = parsed.label.name || site.name;

export function getRosterArtistById(id: string): RosterArtist | undefined {
  return rosterArtists.find((a) => a.spotifyId === id);
}
