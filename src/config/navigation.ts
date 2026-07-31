import { hasModule, type SiteModule } from "./site";
import { routedPages } from "@/data/pages";

export type NavLeaf = {
  nameKey: string;
  href: string;
  module?: SiteModule;
  /** Lucide icon name — rendered in the expanded menu panel. */
  icon?: string;
  /** One-line blurb shown beside the label in the menu panel. */
  description?: string;
};
export type NavEntry =
  | { kind: "standalone"; nameKey: string; href: string; module?: SiteModule; icon?: string }
  | {
      kind: "group";
      labelKey: string;
      module?: SiteModule;
      icon?: string;
      children: NavLeaf[];
      /** Feature tile in the menu panel — image plus caption. */
      feature?: { image: string; label?: string; href: string };
    };

/**
 * Full navigation IA. Each entry/leaf is tagged with the module that owns it;
 * untagged = core (always shown). The exported `navEntries` is filtered to the
 * site's enabled modules, so turning a module off in `site.config` removes its
 * navigation everywhere automatically. Groups with no remaining children drop.
 *
 * `nameKey`/`labelKey` are i18n keys under the `nav` namespace.
 */
const NAV: NavEntry[] = [
  { kind: "standalone", nameKey: "home", href: "/", icon: "Home" },
  {
    kind: "group",
    labelKey: "music",
    module: "music",
    children: [
      { nameKey: "musicOverview", href: "/music" },
      { nameKey: "discography", href: "/music#discography" },
      { nameKey: "topTracks", href: "/music#top-tracks" },
      { nameKey: "tour", href: "/tour", module: "tour" },
      { nameKey: "merch", href: "/merch", module: "merch" },
      { nameKey: "recordLabel", href: "/label", module: "label" },
    ],
  },
  {
    kind: "group",
    labelKey: "ai",
    module: "ai",
    children: [
      { nameKey: "overview", href: "/ai" },
      { nameKey: "publications", href: "/ai#publications" },
      { nameKey: "projects", href: "/ai#projects" },
      { nameKey: "experience", href: "/ai#experience" },
    ],
  },
  {
    kind: "group",
    labelKey: "research",
    module: "research",
    children: [
      { nameKey: "researchOverview", href: "/research" },
      { nameKey: "researchInterests", href: "/research#interests" },
      { nameKey: "researchPublications", href: "/research#publications" },
      { nameKey: "researchCredentials", href: "/research#credentials" },
    ],
  },
  {
    kind: "standalone",
    nameKey: "innovation",
    href: "/innovation",
    module: "innovation",
  },
  {
    kind: "standalone",
    nameKey: "engagements",
    href: "/engagements",
    module: "engagements",
  },
  {
    kind: "group",
    labelKey: "influence",
    module: "influencer",
    children: [
      { nameKey: "overview", href: "/macro-influencer" },
      { nameKey: "brandPartnerships", href: "/macro-influencer#partnerships" },
      { nameKey: "governmentRoles", href: "/macro-influencer#government" },
      { nameKey: "press", href: "/press", module: "press" },
    ],
  },
  {
    kind: "group",
    labelKey: "membership",
    module: "membership",
    children: [
      { nameKey: "plans", href: "/join" },
      { nameKey: "vault", href: "/vault", module: "vault" },
      { nameKey: "gallery", href: "/gallery", module: "gallery" },
    ],
  },
  { kind: "standalone", nameKey: "about", href: "/about" },
  { kind: "standalone", nameKey: "biography", href: "/biography", module: "biography" },
];

const visible = (m?: SiteModule) => !m || hasModule(m);

/**
 * Composed pages (`pages` module, src/data/pages.json) slot in right after
 * Home. Their labels are literal client content rather than i18n keys — the
 * leading "@" marks them so Navbar's `navText` renders them verbatim. Pages
 * with nav children become dropdown groups anchored to block ids.
 *
 * Icons and blurbs are carried through rather than dropped: the header renders
 * an expanded panel, and a panel of bare nouns is no more useful than the flat
 * list it replaced. The first child is always the page overview itself, so a
 * group label is reachable as a destination and not just as a menu toggle.
 */
const literal = (label: string) => `@${label}`;

const pageEntries: NavEntry[] = hasModule("pages")
  ? routedPages
      .filter((p) => p.nav)
      .map((p): NavEntry =>
        p.nav!.children?.length
          ? {
              kind: "group",
              labelKey: literal(p.nav!.label),
              icon: p.nav!.icon,
              children: [
                {
                  nameKey: literal(`${p.nav!.label} overview`),
                  href: `/${p.slug}`,
                  icon: p.nav!.icon,
                  description: p.nav!.description,
                },
                ...p.nav!.children.map((c) => ({
                  nameKey: literal(c.label),
                  href: `/${p.slug}#${c.anchor}`,
                  icon: c.icon,
                  description: c.description,
                })),
              ],
              ...(p.nav!.featureImage
                ? {
                    feature: {
                      image: p.nav!.featureImage,
                      label: p.nav!.featureLabel,
                      href: `/${p.slug}`,
                    },
                  }
                : {}),
            }
          : { kind: "standalone", nameKey: literal(p.nav!.label), href: `/${p.slug}`, icon: p.nav!.icon },
      )
  : [];

const staticEntries: NavEntry[] = NAV.filter((e) => visible(e.module))
  .map((e) =>
    e.kind === "group" ? { ...e, children: e.children.filter((c) => visible(c.module)) } : e,
  )
  .filter((e) => e.kind !== "group" || e.children.length > 0);

export const navEntries: NavEntry[] = [
  ...staticEntries.slice(0, 1),
  ...pageEntries,
  ...staticEntries.slice(1),
];
