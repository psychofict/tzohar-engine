import { z } from "zod";

/**
 * Composed PAGES — the block system that lets a build (and Studio) art-direct
 * whole pages instead of only toggling fixed module routes.
 *
 * A page is an ordered list of typed section blocks. Every block carries the
 * same presentation envelope (`tone`, `textured`, `id`) plus its own content
 * fields; the engine renders each through `src/components/blocks/*` using the
 * site's theme tokens, so a composed page inherits accent/paper/type/motion
 * like any built-in page. The vocabulary is distilled from the first bespoke
 * client build: quote heroes, partner logo strips, numbered
 * pillar cards, news card grids, tabbed master–detail case lists, milestone
 * timelines, publication tables, script pull-quotes, CTA bands.
 *
 * Special slug: a page with slug `"home"` REPLACES the engine's default home
 * composition. Any other slug is served at `/<slug>` (module `pages` must be
 * enabled). `nav` opts a page into the header navigation with literal labels
 * (composed pages are single-locale content, like the rest of `src/data`).
 */

// ── shared envelope ─────────────────────────────────────────────────────────

/** Surface each block sits on. `invert` = dark island via `.section-invert`. */
export const BLOCK_TONES = ["base", "muted", "deep", "invert"] as const;
export const blockToneSchema = z.enum(BLOCK_TONES);
export type BlockTone = z.infer<typeof blockToneSchema>;

/** Full-bleed background media painted behind a whole section. Pairs with
 *  tone:"invert" for cinematic photographic heroes and bands. */
export const blockBackgroundSchema = z.object({
  image: z.string().min(1),
  alt: z.string().optional(),
  /**
   * Alternate plate for LIGHT mode; `image` then serves dark mode only.
   *
   * Photographs are not tone-agnostic. A dark studio portrait carries white
   * display type beautifully and is the whole reason a "dark hero" looks
   * cinematic — but the same file under a light scrim just turns grey, which is
   * why this site's light mode used to open on a near-black band no matter what
   * the theme toggle said. Naming a genuinely bright frame here lets one hero
   * block be dark-cinematic and light-airy without duplicating the block.
   *
   * Both are rendered and toggled by CSS (`dark:` inside `.section-invert` /
   * `.dark`), so there is no theme hook and no hydration flash; the unused one
   * is `hidden`, and Next still lazy-decodes it.
   */
  imageLight: z.string().optional(),
  /**
   * Legibility scrim over the image. `auto` = strong dark on invert, soft
   * otherwise; `dark` is a left-weighted wedge that protects a copy column
   * while leaving the right of the frame readable; `veil` darkens evenly, for a
   * photo too busy to hold type against any one region.
   */
  overlay: z.enum(["auto", "dark", "light", "soft", "veil", "none"]).optional(),
  /**
   * Scrim for the light-mode plate. Defaults to `light`. Split from `overlay`
   * because the two plates are different photographs with different problems —
   * the dark one usually wants `dark`/`veil`, the bright one a white wash.
   */
  overlayLight: z.enum(["auto", "dark", "light", "soft", "veil", "none"]).optional(),
  /** CSS object-position for the light plate. Falls back to `position`. */
  positionLight: z.string().optional(),
  /** CSS object-position for the crop, e.g. "center", "top", "50% 30%". */
  position: z.string().optional(),
  /** Override `position` below the sm breakpoint — art-direct the crop separately for narrow/tall viewports. Falls back to `position`. */
  positionMobile: z.string().optional(),
  /**
   * Mobile crop for the LIGHT plate. Falls back to `positionLight`, then
   * `positionMobile`, then `position`.
   *
   * This exists because `positionMobile` used to be shared by both plates, and a
   * narrow crop is the one setting that absolutely cannot be shared: at 390px the
   * frame keeps a sliver of a wide photograph, so the chosen x decides *which
   * object* is on screen, not merely how it sits. The first real client's home
   * hero pairs a dark head-and-shoulders portrait with a bright full-body frame;
   * the crop tuned for the portrait put the light plate's face directly behind the
   * title, where a white scrim flattened it to grey under dark ink type. Two
   * different photographs need two different answers.
   */
  positionMobileLight: z.string().optional(),
});
export type BlockBackground = z.infer<typeof blockBackgroundSchema>;

const envelope = {
  /** Anchor id — nav children and in-page links target `#<id>`. */
  id: z.string().optional(),
  /** Surface tone. Default "base". */
  tone: blockToneSchema.optional(),
  /** Accent grid-vignette texture behind the block (pairs well with `invert`). */
  textured: z.boolean().optional(),
  /** Optional full-bleed background photo behind the whole section. */
  background: blockBackgroundSchema.optional(),
};

export const blockButtonSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  style: z.enum(["primary", "outline", "ghost"]).optional(),
});

/** Optional standard section header. `sideNote` renders the asymmetric
 *  header (title | hairline | side note) used for feature grids. */
export const blockHeaderSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  sideNote: z.string().optional(),
});

const image = { src: z.string().min(1), alt: z.string().optional() };

// ── block types ─────────────────────────────────────────────────────────────

/** A `label: value` pair for the mono record row under a hero. */
export const blockRecordSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const heroBlockSchema = z.object({
  ...envelope,
  type: z.literal("hero"),
  /** quote = editorial pull-quote hero; banner = title/sub + side photo; plain = text-only. */
  variant: z.enum(["quote", "banner", "plain"]).optional(),
  eyebrow: z.string().optional(),
  /** Use \n for hard line breaks. */
  title: z.string().optional(),
  /**
   * Role / standfirst line under the title, set in the mono label face.
   * A person-brand hero needs to say what the person *is* somewhere above the
   * fold; putting that in `description` buries it in prose.
   */
  role: z.string().optional(),
  /** Quote-variant body (rendered with an oversized accent quote mark). */
  quote: z.string().optional(),
  /** Who said the quote. An unattributed pull-quote reads as a stray fragment. */
  quoteAttribution: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  buttons: z.array(blockButtonSchema).optional(),
  /**
   * Mono `label: value` pairs on a ruled row at the foot of the hero — the
   * fixed facts (based in, affiliation, field). Also the thing that gives a
   * left-weighted hero copy column a defined bottom edge.
   */
  record: z.array(blockRecordSchema).optional(),
  /** Script-font tagline, rendered once as a signature line under the hero. */
  tagline: z.string().optional(),
});

export const logoStripBlockSchema = z.object({
  ...envelope,
  type: z.literal("logoStrip"),
  /** static = centered row (default); marquee = auto-scrolling animated strip. */
  variant: z.enum(["static", "marquee"]).optional(),
  caption: z.string().optional(),
  /** Either one pre-composed strip image… */
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  /** …or individual logos. */
  logos: z.array(z.object(image)).optional(),
});

export const pillarsBlockSchema = z.object({
  ...envelope,
  type: z.literal("pillars"),
  header: blockHeaderSchema.optional(),
  columns: z.number().int().min(2).max(4).optional(),
  items: z.array(
    z.object({
      title: z.string().min(1),
      body: z.string(),
      /** Lucide icon name (see src/lib/icons.ts); numbered badge if unset. */
      icon: z.string().optional(),
      /**
       * Optional photograph at the head of the card. A pillar set is usually the
       * one place on a page where the reader decides which domain is theirs, and
       * three text cards give them nothing to look at while deciding.
       */
      image: z.string().optional(),
      /** Alt text for `image`. Falls back to the pillar's title. */
      imageAlt: z.string().optional(),
      tagsLabel: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
  ),
});

export const statementBlockSchema = z.object({
  ...envelope,
  type: z.literal("statement"),
  heading: z.string().min(1),
  body: z.string().optional(),
  chips: z.array(z.object({ label: z.string().min(1), icon: z.string().optional() })).optional(),
  /** Framed image card under the statement. */
  image: z.string().optional(),
  imageAlt: z.string().optional(),
});

export const cardGridBlockSchema = z.object({
  ...envelope,
  type: z.literal("cardGrid"),
  header: blockHeaderSchema.optional(),
  columns: z.number().int().min(2).max(4).optional(),
  /**
   * `card` (default) is the image-topped tile. `index` is a ruled register row —
   * a small plate beside the text rather than a full-width cover image.
   *
   * Reach for `index` when the source images are small: a tile stretches its
   * cover image to the full column width, so a 240px press thumbnail gets
   * upscaled ~2.7× into mush. An index row renders the same file near its
   * native size, which is both sharper and a better fit for lists of clippings.
   */
  variant: z.enum(["card", "index"]).optional(),
  items: z.array(
    z.object({
      title: z.string().min(1),
      body: z.string().optional(),
      /** Source/outlet/date line, set in the mono label face. */
      meta: z.string().optional(),
      image: z.string().optional(),
      imageAlt: z.string().optional(),
      icon: z.string().optional(),
      linkLabel: z.string().optional(),
      linkUrl: z.string().optional(),
    }),
  ),
});

export const iconListBlockSchema = z.object({
  ...envelope,
  type: z.literal("iconList"),
  header: blockHeaderSchema.optional(),
  /** Lay the list out in 2 columns from md up. Default 1. */
  columns: z.number().int().min(1).max(2).optional(),
  items: z.array(
    z.object({
      title: z.string().min(1),
      body: z.string().optional(),
      icon: z.string().optional(),
      /**
       * Short literal marker shown in place of the icon — an initial, a step
       * number, a year. Use it when the marker carries meaning (the initials of
       * an acronym, an ordered method); leave it unset for a plain icon plate.
       */
      marker: z.string().optional(),
    }),
  ),
});

export const mediaTextBlockSchema = z.object({
  ...envelope,
  type: z.literal("mediaText"),
  header: blockHeaderSchema.optional(),
  heading: z.string().optional(),
  body: z.string(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  /**
   * Several images as a contact-sheet row beneath the text instead of one
   * image beside it. The right shape for a set of small photographs: one tall
   * collage in a half-width column renders as a single enormous upscaled
   * stripe, whereas the same frames side by side stay near native size.
   */
  images: z.array(z.object(image)).optional(),
  /** Put the media on the left instead of the right. */
  flip: z.boolean().optional(),
  buttons: z.array(blockButtonSchema).optional(),
});

export const timelineBlockSchema = z.object({
  ...envelope,
  type: z.literal("timeline"),
  header: blockHeaderSchema.optional(),
  /** cards = expandable milestone grid (default); vertical = connected animated rail. */
  layout: z.enum(["cards", "vertical"]).optional(),
  /** Numbered milestone cards (expandable when `detail` present). */
  milestones: z.array(
    z.object({
      title: z.string().min(1),
      location: z.string().optional(),
      note: z.string().optional(),
      detail: z.string().optional(),
      image: z.string().optional(),
      imageAlt: z.string().optional(),
    }),
  ),
  /** Optional arrow-linked progression row (e.g. university path). */
  flow: z
    .array(
      z.object({
        title: z.string().min(1),
        subtitle: z.string().optional(),
        location: z.string().optional(),
        image: z.string().optional(),
        imageAlt: z.string().optional(),
      }),
    )
    .optional(),
});

export const masterDetailBlockSchema = z.object({
  ...envelope,
  type: z.literal("masterDetail"),
  header: blockHeaderSchema.optional(),
  /** Small uppercase label over the list column, e.g. "FEATURED ENGAGEMENTS". */
  kicker: z.string().optional(),
  items: z.array(
    z.object({
      title: z.string().min(1),
      /** Up to two meta lines shown in the list row (place, date…). */
      meta: z.array(z.string()).optional(),
      thumb: z.string().optional(),
      icon: z.string().optional(),
      detail: z.object({
        eyebrow: z.string().optional(),
        media: z.string().optional(),
        /** Alt text for `media`. Falls back to the item's title. */
        mediaAlt: z.string().optional(),
        /**
         * Visible caption under `media`. Use it whenever the photograph is not
         * self-evidently of this entry — a captioned photograph documents what
         * it shows, whereas an uncaptioned one inside a dated entry silently
         * claims to *be* that entry.
         */
        mediaCaption: z.string().optional(),
        videoUrl: z.string().optional(),
        rows: z.array(
          z.object({
            title: z.string().min(1),
            body: z.string(),
            icon: z.string().optional(),
          }),
        ),
      }),
    }),
  ),
  viewAllLabel: z.string().optional(),
  viewAllHref: z.string().optional(),
});

export const tableBlockSchema = z.object({
  ...envelope,
  type: z.literal("table"),
  header: blockHeaderSchema.optional(),
  columns: z.array(z.object({ key: z.string().min(1), label: z.string() })),
  rows: z.array(z.record(z.string(), z.string())),
  /** Column key whose cell is a URL, rendered as an accent external link. */
  linkKey: z.string().optional(),
  linkLabel: z.string().optional(),
  /** Column key to expose as a client-side filter-chip bar (distinct values). */
  filterKey: z.string().optional(),
  /** Label for the "show all" chip (default "All"). */
  filterAllLabel: z.string().optional(),
});

export const quoteBlockSchema = z.object({
  ...envelope,
  type: z.literal("quote"),
  text: z.string().min(1),
  attribution: z.string().optional(),
  /** Render in the script accent font between accent hairlines. */
  script: z.boolean().optional(),
});

export const ctaBlockSchema = z.object({
  ...envelope,
  type: z.literal("cta"),
  heading: z.string().min(1),
  description: z.string().optional(),
  buttons: z.array(blockButtonSchema).optional(),
});

export const statsBlockSchema = z.object({
  ...envelope,
  type: z.literal("stats"),
  header: blockHeaderSchema.optional(),
  columns: z.number().int().min(2).max(4).optional(),
  items: z.array(
    z.object({
      /** Headline figure — "50+", "1M+", "10y", "98%". A leading number counts up on scroll. */
      value: z.string().min(1),
      label: z.string().min(1),
      detail: z.string().optional(),
      icon: z.string().optional(),
    }),
  ),
});

/**
 * GALLERY — captioned photo/video grid with category filters and a lightbox.
 *
 * The brief asks every engagement page to carry "event photographs, embedded
 * videos, captions for all media". `cardGrid` can show pictures but each needs
 * a title and body, so a set of 20 event photographs turns into 20 headings;
 * this block treats the image as the content and the caption as apparatus.
 */
export const galleryBlockSchema = z.object({
  ...envelope,
  type: z.literal("gallery"),
  header: blockHeaderSchema.optional(),
  /** Filter-chip categories. Items reference these by key; omit for no filters. */
  categories: z.array(z.object({ key: z.string().min(1), label: z.string().min(1) })).optional(),
  /** Columns at the widest breakpoint. Default 3. */
  columns: z.number().int().min(2).max(4).optional(),
  items: z.array(
    z.object({
      /** Poster/still for a video item, or the photograph itself. */
      src: z.string().min(1),
      alt: z.string().optional(),
      /** Visible caption — what the frame shows, and where. */
      caption: z.string().optional(),
      /** Event/date line, set in the mono label face. */
      meta: z.string().optional(),
      category: z.string().optional(),
      /** Present ⇒ the tile is a video: `src` is its poster, this is the file. */
      video: z.string().optional(),
      /** Credit line for third-party footage or photography. */
      credit: z.string().optional(),
      /** Span two grid columns — for a frame that deserves the width. */
      wide: z.boolean().optional(),
    }),
  ),
});

/**
 * VIDEO — one featured film with its poster, caption and credit.
 *
 * `preload="none"` and the poster still mean an unplayed video costs one JPEG,
 * not the whole file; the institute film alone is 19MB.
 */
export const videoBlockSchema = z.object({
  ...envelope,
  type: z.literal("video"),
  header: blockHeaderSchema.optional(),
  src: z.string().min(1),
  poster: z.string().optional(),
  caption: z.string().optional(),
  /** Attribution — required in practice for footage the subject didn't shoot. */
  credit: z.string().optional(),
  /** Portrait sources get a narrower frame instead of a letterboxed one. */
  orientation: z.enum(["landscape", "portrait"]).optional(),
  body: z.string().optional(),
  buttons: z.array(blockButtonSchema).optional(),
});

/**
 * JOURNEY — the interactive map of an academic/professional path.
 *
 * Stops are ordered and drawn as an animated route; selecting one reveals its
 * institution, programme, years and photographs. `future` marks a planned stop
 * so an aspiration isn't presented as history.
 */
export const journeyBlockSchema = z.object({
  ...envelope,
  type: z.literal("journey"),
  header: blockHeaderSchema.optional(),
  /** Pre-rendered map artwork shown behind/instead of the plotted route. */
  mapImage: z.string().optional(),
  mapImageAlt: z.string().optional(),
  stops: z.array(
    z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      /** Decimal degrees. Drives both the marker and the route path. */
      lat: z.number(),
      lng: z.number(),
      /**
       * Marker position as a percentage of the `mapImage`, when one is set.
       * Supplied map artwork is illustrative rather than equirectangular — the
       * continents are restyled and rescaled — so projecting lat/lng onto it
       * would land the pins in the sea. These place them by eye against the
       * artwork; `lat`/`lng` still drive the projected fallback map.
       */
      x: z.number().min(0).max(100).optional(),
      y: z.number().min(0).max(100).optional(),
      period: z.string().optional(),
      institution: z.string().optional(),
      program: z.string().optional(),
      achievements: z.array(z.string()).optional(),
      image: z.string().optional(),
      imageAlt: z.string().optional(),
      /** Planned rather than completed — rendered as a hollow marker. */
      future: z.boolean().optional(),
    }),
  ),
});

/**
 * PORTFOLIO — the "Build My Portfolio" export.
 *
 * The visitor picks and reorders sections, previews, then downloads a PDF. The
 * block only declares which sections are offered; assembly lives in the engine.
 */
export const portfolioBlockSchema = z.object({
  ...envelope,
  type: z.literal("portfolio"),
  header: blockHeaderSchema.optional(),
  /**
   * Selectable sections, in their default order — each carrying its own copy.
   *
   * The engine's older media-kit builder assembled the PDF out of the *module*
   * content files and gated each section on `hasModule`, so on a site composed
   * entirely from `pages` (this one) every section evaluated as unavailable and
   * the tool offered nothing but "Contact". Carrying the copy on the block keeps
   * the export working for a pages-only build and, more importantly, lets the
   * PDF say something different from the web page where that reads better.
   */
  sections: z.array(
    z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      /** Pre-ticked when the builder opens. Default true. */
      default: z.boolean().optional(),
      /** Prose paragraphs. Blank lines in a single string also split. */
      body: z.string().optional(),
      /** Bulleted lines — achievements, interests, a publication list. */
      items: z.array(z.string()).optional(),
      /** `label: value` rows, for dated or placed records. */
      records: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).optional(),
    }),
  ),
  /** Download filename, without the .pdf extension. */
  fileName: z.string().optional(),
  note: z.string().optional(),
});

/**
 * POST LIST — the latest entries from `src/data/posts.json`.
 *
 * The block names *how many* and *which category*, never the posts themselves.
 * A page that hard-listed its own articles would need re-composing on every
 * publish, which defeats having a posts store at all.
 */
export const postListBlockSchema = z.object({
  ...envelope,
  type: z.literal("postList"),
  header: blockHeaderSchema.optional(),
  /** Restrict to one post category key. Omit for all. */
  category: z.string().optional(),
  /** Cap the number shown. Omit for all (the index page). */
  limit: z.number().int().min(1).max(50).optional(),
  columns: z.number().int().min(1).max(3).optional(),
  /** Expose the category chips as a client-side filter. */
  showFilters: z.boolean().optional(),
  emptyNote: z.string().optional(),
  viewAllLabel: z.string().optional(),
  viewAllHref: z.string().optional(),
});

/**
 * A lab, research group or team.
 *
 * The one section type an academic site needs that a portfolio site does not:
 * a group has *members*, they have roles and they leave, and a visitor arriving
 * from a paper wants to know who is on the team and how to reach them. The
 * alternative — a cardGrid of people — loses the two things that matter, the
 * role hierarchy and the alumni, and gives every member a full-width cover photo
 * they almost never have.
 *
 * `group` is a free label ("Principal investigator", "PhD students", "Alumni")
 * rather than an enum: academic hierarchies differ by country, by discipline and
 * by institution, and an enum would be wrong somewhere immediately. Members are
 * rendered in the order given, grouped in first-appearance order.
 */
export const peopleBlockSchema = z.object({
  ...envelope,
  type: z.literal("people"),
  header: blockHeaderSchema.optional(),
  /** Portrait shape. `round` reads as a team; `square` as a directory. */
  portrait: z.enum(["round", "square"]).optional(),
  columns: z.number().int().min(2).max(4).optional(),
  members: z.array(
    z.object({
      name: z.string().min(1),
      /** Position — "Postdoctoral researcher", "MEng candidate". */
      role: z.string().optional(),
      /** Grouping heading. Members with no group render before any group. */
      group: z.string().optional(),
      photo: z.string().optional(),
      photoAlt: z.string().optional(),
      /** One or two lines: interests, or where an alum went. */
      note: z.string().optional(),
      /** Where to reach them, or read them. */
      email: z.string().optional(),
      url: z.string().optional(),
      orcid: z.string().optional(),
      scholar: z.string().optional(),
      /** Years active — "2022–2024" for alumni, "since 2021" for current. */
      period: z.string().optional(),
    }),
  ),
});

// tabs nests blocks — declared with an explicit recursive type + z.lazy.

const leafBlockSchemas = [
  galleryBlockSchema,
  postListBlockSchema,
  videoBlockSchema,
  journeyBlockSchema,
  portfolioBlockSchema,
  peopleBlockSchema,
  heroBlockSchema,
  logoStripBlockSchema,
  pillarsBlockSchema,
  statementBlockSchema,
  statsBlockSchema,
  cardGridBlockSchema,
  iconListBlockSchema,
  mediaTextBlockSchema,
  timelineBlockSchema,
  masterDetailBlockSchema,
  tableBlockSchema,
  quoteBlockSchema,
  ctaBlockSchema,
] as const;

export type LeafBlock =
  | z.infer<typeof galleryBlockSchema>
  | z.infer<typeof postListBlockSchema>
  | z.infer<typeof videoBlockSchema>
  | z.infer<typeof journeyBlockSchema>
  | z.infer<typeof portfolioBlockSchema>
  | z.infer<typeof peopleBlockSchema>
  | z.infer<typeof heroBlockSchema>
  | z.infer<typeof logoStripBlockSchema>
  | z.infer<typeof pillarsBlockSchema>
  | z.infer<typeof statementBlockSchema>
  | z.infer<typeof statsBlockSchema>
  | z.infer<typeof cardGridBlockSchema>
  | z.infer<typeof iconListBlockSchema>
  | z.infer<typeof mediaTextBlockSchema>
  | z.infer<typeof timelineBlockSchema>
  | z.infer<typeof masterDetailBlockSchema>
  | z.infer<typeof tableBlockSchema>
  | z.infer<typeof quoteBlockSchema>
  | z.infer<typeof ctaBlockSchema>;

export interface TabsBlock {
  type: "tabs";
  id?: string;
  tone?: BlockTone;
  textured?: boolean;
  background?: BlockBackground;
  items: Array<{
    label: string;
    icon?: string;
    /** One level of nesting only — tabs inside tabs are rejected. */
    blocks: LeafBlock[];
  }>;
}

export type PageBlock = LeafBlock | TabsBlock;

const leafBlockSchema = z.discriminatedUnion("type", [...leafBlockSchemas]);

export const tabsBlockSchema: z.ZodType<TabsBlock> = z.object({
  ...envelope,
  type: z.literal("tabs"),
  items: z.array(
    z.object({
      label: z.string().min(1),
      icon: z.string().optional(),
      blocks: z.array(leafBlockSchema),
    }),
  ),
});

export const pageBlockSchema: z.ZodType<PageBlock> = z.union([leafBlockSchema, tabsBlockSchema]);

// ── pages ───────────────────────────────────────────────────────────────────

export const pageNavSchema = z.object({
  /** Literal nav label (composed pages are single-locale content). */
  label: z.string().min(1),
  icon: z.string().optional(),
  /**
   * Show this page in the HEADER BAR. Defaults to true; set false to keep a page
   * in the footer sitemap and the CRM's menu listing while leaving it out of the
   * top-level tabs.
   *
   * Separating the two is what makes a short bar possible without orphaning
   * pages. `nav` previously meant both "is in the menu" and "is in the bar", so
   * the only way to shorten the bar was to delete `nav` — which also deleted the
   * page from the footer, leaving it reachable by URL alone. This site's brief
   * asks for three tabs and says of the biography page, in writing, "dont make
   * it a tab"; it still needs to be linked.
   */
  inBar: z.boolean().optional(),
  /** One-line blurb for the header's expanded menu panel. */
  description: z.string().optional(),
  /** Dropdown children — anchors must match a block `id` on the page. */
  children: z
    .array(
      z.object({
        label: z.string().min(1),
        anchor: z.string().min(1),
        icon: z.string().optional(),
        /**
         * One line explaining what the section holds. A dropdown of four bare
         * nouns ("Science", "Education", "Technology", "Community") tells a
         * first-time visitor nothing about which one to open.
         */
        description: z.string().optional(),
      }),
    )
    .optional(),
  /** Optional image for the menu panel's feature tile. */
  featureImage: z.string().optional(),
  featureLabel: z.string().optional(),
});

export const pageSchema = z.object({
  /** URL path segment. `"home"` replaces the default home composition. */
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase slug, e.g. \"public-diplomacy\""),
  title: z.string().min(1),
  seo: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
  nav: pageNavSchema.optional(),
  blocks: z.array(pageBlockSchema),
});

export const pagesSchema = z
  .object({ pages: z.array(pageSchema) })
  .superRefine((val, ctx) => {
    const seen = new Set<string>();
    val.pages.forEach((p, i) => {
      if (seen.has(p.slug)) {
        ctx.addIssue({ code: "custom", path: ["pages", i, "slug"], message: `Duplicate slug "${p.slug}".` });
      }
      seen.add(p.slug);
    });
  });

export type BlockButton = z.infer<typeof blockButtonSchema>;
export type BlockHeader = z.infer<typeof blockHeaderSchema>;
export type SitePage = z.infer<typeof pageSchema>;
export type PagesContent = z.infer<typeof pagesSchema>;

// ── Studio metadata ─────────────────────────────────────────────────────────

/** Block-type catalog for Studio's picker + AI prompts. */
export const PAGE_BLOCK_TYPES: ReadonlyArray<{ type: PageBlock["type"]; label: string; blurb: string }> = [
  { type: "hero", label: "Hero", blurb: "Page opener — pull-quote, banner with photo, or plain title." },
  { type: "logoStrip", label: "Logo strip", blurb: "Partner / press logos with an optional caption." },
  { type: "pillars", label: "Pillar cards", blurb: "Numbered cards with body text and tag chips." },
  { type: "statement", label: "Statement", blurb: "Big editorial heading, supporting text, chips, framed image." },
  { type: "stats", label: "Stat band", blurb: "Big counting-up figures with labels — impact, reach, years." },
  { type: "cardGrid", label: "Card grid", blurb: "Image/icon cards with links — news, features, categories." },
  { type: "iconList", label: "Icon list", blurb: "Compact rows with icon badges — achievements, plans." },
  { type: "mediaText", label: "Media + text", blurb: "Prose beside an image, optional buttons." },
  { type: "timeline", label: "Timeline", blurb: "Numbered milestone cards plus an optional progression row." },
  { type: "masterDetail", label: "Master–detail", blurb: "Clickable list with a rich detail panel per item." },
  { type: "people", label: "People / lab group", blurb: "Team members with portraits, roles and links — grouped, with alumni." },
  { type: "gallery", label: "Gallery", blurb: "Captioned photo/video grid with category filters and a lightbox." },
  { type: "postList", label: "Post list", blurb: "Latest posts from the posts store — articles, commentary, blog." },
  { type: "video", label: "Video", blurb: "One featured film with poster, caption and credit." },
  { type: "journey", label: "Journey map", blurb: "Interactive map of an academic/professional path." },
  { type: "portfolio", label: "Portfolio builder", blurb: "Visitor picks sections and downloads a PDF portfolio." },
  { type: "tabs", label: "Tabs", blurb: "Tab bar where each tab holds its own blocks." },
  { type: "table", label: "Table", blurb: "Column table — publications, records — with optional link column." },
  { type: "quote", label: "Pull quote", blurb: "Script or serif quote between accent hairlines." },
  { type: "cta", label: "CTA band", blurb: "Closing call-to-action with buttons." },
] as const;

/** Fresh minimal instance of a block type (Studio "add block"). */
export function emptyBlock(type: PageBlock["type"]): PageBlock {
  switch (type) {
    case "hero":
      return { type, variant: "banner", title: "New page", tone: "invert", textured: true };
    case "logoStrip":
      return { type, caption: "", logos: [] };
    case "pillars":
      return { type, items: [{ title: "Pillar", body: "", tags: [] }] };
    case "statement":
      return { type, heading: "A statement heading" };
    case "stats":
      return { type, items: [{ value: "100+", label: "Label" }] };
    case "cardGrid":
      return { type, items: [{ title: "Card", body: "" }] };
    case "iconList":
      return { type, items: [{ title: "Item", body: "" }] };
    case "mediaText":
      return { type, heading: "Heading", body: "" };
    case "timeline":
      return { type, milestones: [{ title: "Milestone" }] };
    case "masterDetail":
      return { type, items: [{ title: "Item", detail: { rows: [{ title: "Overview", body: "" }] } }] };
    case "gallery":
      return { type, items: [], columns: 3 };
    case "postList":
      return { type, columns: 3, limit: 6 };
    case "video":
      return { type, src: "", caption: "" };
    case "journey":
      return { type, stops: [{ key: "stop-1", label: "Stop", lat: 0, lng: 0 }] };
    case "portfolio":
      return {
        type,
        sections: [
          { key: "biography", label: "Biography", default: true },
          { key: "education", label: "Education", default: true },
        ],
      };
    case "people":
      return {
        type,
        header: { eyebrow: "The group", title: "People" },
        members: [{ name: "Name", role: "Role" }],
      };
    case "tabs":
      return { type, items: [{ label: "Tab 1", blocks: [] }] };
    case "table":
      return { type, columns: [{ key: "col1", label: "Column" }], rows: [] };
    case "quote":
      return { type, text: "Quote text", script: true };
    case "cta":
      return { type, heading: "Work with us", buttons: [{ label: "Get in touch", href: "/contact" }] };
  }
}
