import { site, canonicalUrl } from "@/config/site";
import { label, labelName } from "@/data/roster";

/**
 * schema.org Organization for the record label — the `label` module only.
 *
 * Moved out of `src/lib/structured-data.ts` for the same reason as the MusicGroup:
 * it was emitted from the ROOT layout, so the reference build's label copy (its
 * artist count, its countries, its stream total) sat in a core file that shipped to
 * every client repo, module or no module. An Organization describing a label also
 * belongs on the label's own pages rather than on every page of the site.
 *
 * Every value now comes from `roster.json`. They were literals here, so a client
 * who enabled the module published structured data telling search engines their
 * site was about somebody else's record label — and a wrong Organization is worse
 * than no Organization, because it is machine-readable and believed. Returns null
 * when no label is configured, for that reason.
 */
export function getOrganizationSchema() {
  if (!label.name) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site.url}/#label`,
    name: labelName,
    ...(label.alternateNames.length ? { alternateName: label.alternateNames } : {}),
    url: canonicalUrl(site.locales.default, "/label"),
    ...(label.logoSquare
      ? {
          logo: {
            "@type": "ImageObject",
            url: `${site.url}${label.logoSquare}`,
            caption: label.description ? `${labelName} — ${label.description}` : labelName,
          },
        }
      : {}),
    ...(label.foundingYear ? { foundingDate: label.foundingYear } : {}),
    ...(label.foundingLocation
      ? { foundingLocation: { "@type": "Place", name: label.foundingLocation } }
      : {}),
    founder: {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.name,
      url: site.url,
    },
    ...(label.description ? { description: label.description } : {}),
    ...(label.artistCount
      ? {
          numberOfEmployees: {
            "@type": "QuantitativeValue",
            minValue: label.artistCount,
            unitText: "artists",
          },
        }
      : {}),
    // The LABEL's profiles, not the site owner's — `allSameAs()` is the person's.
    sameAs: Array.from(
      new Set([
        ...label.socials.map((s) => s.url),
        ...(label.spotifyArtistId
          ? [`https://open.spotify.com/artist/${label.spotifyArtistId}`]
          : []),
      ])
    ),
  };
}
