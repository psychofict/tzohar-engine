import { site, allSameAs, canonicalUrl } from "@/config/site";
import { routedPages } from "@/data/pages";

/**
 * schema.org Person, built from `site.person` rather than from constants in this
 * file. The facts here are the most client-specific data on a site (biography,
 * degrees, awards) and living in engine code meant every new build shipped the
 * previous client's CV until somebody noticed. Everything is optional: with no
 * `person` block a site still emits a valid Person from name/description/socials.
 */
export function getPersonSchema() {
  const p = site.person ?? {};
  const based = site.location?.based;
  /**
   * `location.from` is written for humans — "Mwenezi, Zimbabwe" — but a
   * schema.org Country wants the country, so emitting the whole string declared a
   * Country named after a rural district. Take the last comma-separated part.
   */
  const country = (name?: string) => {
    const c = name?.split(",").pop()?.trim();
    return c ? { "@type": "Country", name: c } : undefined;
  };

  return prune({
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${site.url}/#person`,
    name: site.name,
    alternateName: site.alternateNames,
    givenName: p.givenName,
    familyName: p.familyName,
    url: site.url,
    image: {
      "@type": "ImageObject",
      url: `${site.url}${site.brand.ogImage}`,
      width: 1200,
      height: 630,
      caption: p.imageCaption ?? `${site.name} — ${site.tagline}`,
    },
    description: p.description ?? site.description,
    birthDate: p.birthDate,
    birthPlace: p.birthPlace
      ? {
          "@type": "Place",
          name: p.birthPlace.name,
          address: prune({
            "@type": "PostalAddress",
            addressLocality: p.birthPlace.locality,
            addressCountry: p.birthPlace.country,
          }),
        }
      : undefined,
    nationality: country(site.location?.from),
    homeLocation: based ? { "@type": "Place", name: based } : undefined,
    sameAs: allSameAs(),
    jobTitle: p.jobTitles,
    hasOccupation: p.occupations?.map((o) =>
      prune({
        "@type": "Occupation",
        name: o.name,
        occupationLocation: o.location ? { "@type": "Place", name: o.location } : undefined,
        description: o.description,
      }),
    ),
    worksFor: p.worksFor?.map((w) => prune({ "@type": "Organization", name: w.name, url: w.url, description: w.description })),
    alumniOf: p.alumniOf?.map((a) => prune({ "@type": "CollegeOrUniversity", name: a.name, url: a.url })),
    hasCredential: p.credentials?.map((c) =>
      prune({
        "@type": "EducationalOccupationalCredential",
        credentialCategory: c.category ?? "degree",
        educationalLevel: c.level,
        name: c.name,
        recognizedBy: c.institution ? { "@type": "CollegeOrUniversity", name: c.institution } : undefined,
      }),
    ),
    award: p.awards,
    memberOf: p.memberOf?.map((m) => prune({ "@type": "Organization", name: m.name, description: m.description, roleName: m.roleName })),
    knowsAbout: p.knowsAbout,
    knowsLanguage: (p.knowsLanguage ?? site.locales.enabled).map((l) => ({ "@type": "Language", alternateName: l })),
    performerIn: p.events?.map((e) =>
      prune({
        "@type": "Event",
        name: e.name,
        startDate: e.startDate,
        location: e.location ? { "@type": "Place", name: e.location } : undefined,
      }),
    ),
  });
}

/** Drop undefined / empty-array members so the emitted JSON-LD stays clean. */
function prune<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0)),
  ) as T;
}


export function getMusicAlbumSchema(album: {
  title: string;
  year: number;
  tracks?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    name: album.title,
    datePublished: `${album.year}`,
    byArtist: {
      "@type": "MusicGroup",
      name: site.name,
      url: site.url,
    },
    numTracks: album.tracks,
    albumProductionType: "StudioAlbum",
  };
}

export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    name: site.name,
    alternateName: site.alternateNames,
    url: site.url,
    description: site.description,
    publisher: { "@type": "Person", "@id": `${site.url}/#person` },
    inLanguage: site.locales.default,
  };
}

export function getSiteNavigationSchema() {
  // Driven by the same composed-page content that actually renders in nav
  // (see @/config/navigation) rather than a hardcoded list — a hardcoded
  // list drifts the moment modules or pages change, and previously pointed
  // to routes this site doesn't even have enabled.
  const composedEntries = routedPages
    .filter((p) => p.nav)
    .map((p) => ({ name: p.nav!.label, url: canonicalUrl(site.locales.default, `/${p.slug}`) }));

  const entries = [
    { name: "Home", url: site.url },
    ...composedEntries,
    { name: "About", url: canonicalUrl(site.locales.default, "/about") },
    { name: "Contact", url: canonicalUrl(site.locales.default, "/contact") },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Site Navigation",
    itemListElement: entries.map((e, i) => ({
      "@type": "SiteNavigationElement",
      position: i + 1,
      name: e.name,
      url: e.url,
    })),
  };
}

/**
 * A track's album and streaming link are OPTIONAL. They stopped being guaranteed
 * when this data moved from a TypeScript literal to validated content, which is the
 * honest shape: a release can exist before it is on a platform, and a single has no
 * album. Absent members are pruned rather than emitted empty — an `inAlbum` with no
 * name is worse structured data than no `inAlbum` at all.
 */
export function getMusicRecordingSchema(track: {
  title: string;
  source?: string;
  spotifyUrl?: string;
  streams?: string;
}) {
  return prune({
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: track.title,
    url: track.spotifyUrl,
    inAlbum: track.source ? { "@type": "MusicAlbum", name: track.source } : undefined,
    byArtist: {
      "@type": "MusicGroup",
      name: site.name,
      url: site.url,
    },
    ...(track.streams
      ? {
          interactionStatistic: {
            "@type": "InteractionCounter",
            interactionType: { "@type": "ListenAction" },
            userInteractionCount: track.streams.replace(/,/g, ""),
          },
        }
      : {}),
  });
}

export function getBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getFAQSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}


export function getEbenworksOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://ebenworks.co/#org",
    name: "Ebenworks",
    url: "https://ebenworks.co",
    foundingDate: "2026",
    foundingLocation: {
      "@type": "Place",
      name: "Seoul, South Korea",
    },
    description:
      "Ebenworks is a Seoul software studio building AI products for markets the industry overlooks. Nine products are live, among them Imali (a WhatsApp business OS for Africa's informal merchants, live in five countries) and Chingu (a Korean-native voice AI for seniors).",
    founder: {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      // The person behind the group: their legal name if config gives one, else
      // the site's own name. This was a hardcoded literal.
      name: [site.person?.givenName, site.person?.familyName].filter(Boolean).join(" ") || site.name,
      url: site.url,
    },
    subOrganization: [
      {
        "@type": "Organization",
        name: "Imali",
        url: "https://imali.ebenworks.co",
        description: "WhatsApp business OS for Africa's informal merchants, live in five countries",
      },
      {
        "@type": "Organization",
        name: "Chingu",
        url: "https://chingu-ai.ebenworks.co",
        description: "Korean-native voice AI that checks on seniors daily",
      },
    ],
  };
}
