import { site, allSameAs } from "@/config/site";
import { artist, albums, topTracks } from "@/data/artist";

/**
 * schema.org MusicGroup — for the `music` module only.
 *
 * It lived in `src/lib/structured-data.ts` and was emitted from the ROOT layout,
 * which put the reference build's discography (album titles, track names, stream
 * counts) into a core file that every client repo therefore carried, even with the
 * module switched off. Two things were wrong with that: a MusicGroup belongs on the
 * music page rather than on every page of the site, and core files cannot be pruned.
 *
 * Here it is owned by the module, so a client who doesn't run `music` never
 * receives it — see packages/schema/src/module-paths.ts.
 *
 * The discography is read from `artist.json` now rather than being four literal
 * albums and three literal tracks. Those were the last per-site facts in engine
 * code: a client publishing structured data that named somebody else's albums as
 * their own, to search engines, which read it and believe it.
 *
 * Returns null when there is nothing to describe. An empty MusicGroup is not a
 * neutral fallback — it is a claim about the site that happens to be blank.
 */
export function getMusicGroupSchema() {
  if (!albums.length && !topTracks.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": `${site.url}/#musicgroup`,
    name: artist.name || site.name,
    alternateName: site.alternateNames?.[1],
    url: `${site.url}/music`,
    image: `${site.url}${site.brand.ogImage}`,
    ...(artist.bio ? { description: artist.bio } : {}),
    ...(artist.genres.length ? { genre: artist.genres } : {}),
    // From config, not a fixed list of the reference build's own profiles.
    sameAs: allSameAs(),
    member: {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      // The person behind the group: their legal name if config gives one, else
      // the site's own name. This was a hardcoded literal.
      name: [site.person?.givenName, site.person?.familyName].filter(Boolean).join(" ") || site.name,
    },
    ...(artist.activeSince ? { foundingDate: artist.activeSince } : {}),
    ...(artist.basedIn ? { foundingLocation: { "@type": "Place", name: artist.basedIn } } : {}),
    ...(albums.length
      ? {
          album: albums.map((a) => ({
            "@type": "MusicAlbum",
            name: a.title,
            datePublished: String(a.year),
            ...(a.spotifyUrl ? { url: a.spotifyUrl } : {}),
            ...(a.tracks ? { numTracks: a.tracks } : {}),
          })),
        }
      : {}),
    ...(topTracks.length
      ? {
          track: topTracks.map((t) => ({
            "@type": "MusicRecording",
            name: t.title,
            ...(t.spotifyUrl ? { url: t.spotifyUrl } : {}),
          })),
        }
      : {}),
    ...(artist.streamCount
      ? {
          interactionStatistic: {
            "@type": "InteractionCounter",
            interactionType: { "@type": "ListenAction" },
            userInteractionCount: artist.streamCount,
          },
        }
      : {}),
  };
}
