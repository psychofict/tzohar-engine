import type { SiteModule, ThemePreset, SiteKind, Appearance, SiteLayout } from "./config";
import type { PagesContent } from "./content/pages";

/**
 * Starter templates — one-click presets that give a site a complete SIGNATURE
 * for a common vertical: modules + accent theme + a full appearance (font,
 * paper, type scale, motion, radius) + layout (hero art direction, section
 * style). Applied in Studio over the current config; the client then
 * customizes. Two templates should feel like two different studios built them.
 */
export interface StarterTemplate {
  id: string;
  label: string;
  blurb: string;
  kind: SiteKind;
  theme: ThemePreset;
  appearance: Appearance;
  layout: SiteLayout;
  modules: SiteModule[];
}

export const STARTER_TEMPLATES: readonly StarterTemplate[] = [
  {
    id: "musician",
    label: "Musician",
    blurb: "Dark stage, loud type, springy motion — releases, tour, gallery.",
    kind: "musician",
    theme: "violet",
    appearance: { font: "unbounded", paper: "noir", typeScale: "expressive", motion: "kinetic", radius: "soft", mode: "dark" },
    layout: { hero: "photo", sections: "cards" },
    modules: ["music", "gallery", "tour", "press", "links", "merch"],
  },
  {
    id: "creator",
    label: "Creator / Influencer",
    blurb: "Warm, personal, portrait-led — influence, gallery, membership.",
    kind: "creator",
    theme: "sunset",
    appearance: { font: "bricolage", paper: "warm", typeScale: "expressive", motion: "rise", radius: "round" },
    layout: { hero: "portrait", sections: "cards" },
    modules: ["influencer", "gallery", "press", "links", "membership"],
  },
  {
    id: "founder",
    label: "Founder / Pro",
    blurb: "Clean paper, sharp edges, no theatrics — work, press, links.",
    kind: "business",
    theme: "slate",
    appearance: { font: "manrope", paper: "pure", typeScale: "classic", motion: "still", radius: "sharp" },
    layout: { hero: "split", sections: "editorial" },
    modules: ["ai", "press", "links"],
  },
  {
    id: "artist",
    label: "Visual artist",
    blurb: "Gallery paper, serif statements, blur-crossfade reveals.",
    kind: "creator",
    theme: "rose",
    appearance: { font: "instrument", paper: "sand", typeScale: "statement", motion: "editorial", radius: "sharp" },
    layout: { hero: "type", sections: "editorial" },
    modules: ["gallery", "press", "links", "merch"],
  },
  {
    id: "minimal",
    label: "Minimal",
    blurb: "Type-led, quiet, just the essentials — a link hub.",
    kind: "person",
    theme: "default",
    appearance: { font: "jakarta", paper: "pure", typeScale: "classic", motion: "still" },
    layout: { hero: "type", sections: "editorial" },
    modules: ["links"],
  },
  {
    id: "academic",
    label: "Academic / Researcher",
    blurb: "Research, innovation, and public engagement — for scientists, scholars, and diplomats.",
    kind: "person",
    theme: "default",
    appearance: { font: "inter", paper: "noir", typeScale: "expressive", motion: "still", radius: "soft" },
    layout: { hero: "split", sections: "editorial", heroTone: "dark" },
    modules: ["research", "innovation", "engagements", "biography", "links", "pages"],
  },
] as const;

/**
 * Starter PAGE COMPOSITIONS — templates that also ship composed pages get an
 * entry here (keyed by template id). Applied alongside the config signature so
 * one click yields a bespoke-feeling site skeleton (block structure + tone
 * rhythm distilled from the first hand-built client site);
 * the operator or the AI page generator then replaces the placeholder copy.
 * Image fields are deliberately omitted — clients upload photos in Studio.
 */
export const STARTER_PAGES: Readonly<Record<string, PagesContent>> = {
  academic: {
    pages: [
      {
        slug: "home",
        title: "Home",
        blocks: [
          {
            type: "hero",
            variant: "quote",
            tone: "invert",
            textured: true,
            eyebrow: "A mission statement in one line",
            quote:
              "… a personal manifesto goes here — the single conviction that drives the research, the ventures, and the advocacy.",
            buttons: [
              { label: "Biography", href: "/biography", style: "primary" },
              { label: "Learn more", href: "/research", style: "outline" },
            ],
            tagline: "a signature motto in script",
          },
          {
            type: "statement",
            tone: "muted",
            heading: "A bold editorial statement about the journey and where it leads.",
            body: "Two or three sentences that frame the story: the problems worth solving, the values behind the work, and the value created along the way.",
            chips: [
              { label: "First focus area", icon: "Briefcase" },
              { label: "Second focus area", icon: "Heart" },
              { label: "Third focus area", icon: "Globe2" },
            ],
          },
          {
            type: "pillars",
            tone: "muted",
            columns: 3,
            items: [
              {
                title: "Research",
                body: "What the research is, why it matters, and where it's headed — three or four sentences of specific, confident copy.",
                tagsLabel: "KEY INTEREST AREAS",
                tags: ["Area one", "Area two", "Area three", "Area four"],
              },
              {
                title: "Innovation",
                body: "How discovery becomes ventures and deployed solutions — the incubation work, the fields, the standards it's held to.",
                tagsLabel: "KEY INTEREST AREAS",
                tags: ["Area one", "Area two", "Area three", "Area four"],
              },
              {
                title: "Public engagement",
                body: "How the work reaches institutions and policy — engagements, talks, and commentary that turn credibility into partnerships.",
                tagsLabel: "KEY INTEREST AREAS",
                tags: ["Area one", "Area two", "Area three", "Area four"],
              },
            ],
          },
          {
            type: "cardGrid",
            tone: "invert",
            id: "news",
            header: {
              eyebrow: "OUR IMPACT IN ACTION",
              title: "News & Features",
              description: "The people empowered, the institutions strengthened, the value created.",
              sideNote: "Selected stories from the work around the world.",
            },
            columns: 3,
            items: [
              { title: "Feature one", body: "One-sentence summary of the story.", icon: "Newspaper", linkLabel: "READ STORY", linkUrl: "#" },
              { title: "Feature two", body: "One-sentence summary of the story.", icon: "Globe2", linkLabel: "READ STORY", linkUrl: "#" },
              { title: "Feature three", body: "One-sentence summary of the story.", icon: "Trophy", linkLabel: "READ STORY", linkUrl: "#" },
            ],
          },
          {
            type: "cta",
            tone: "invert",
            textured: true,
            heading: "Partner with us",
            description: "Collaborations, speaking, and joint programs.",
            buttons: [{ label: "Get in touch", href: "/contact" }],
          },
        ],
      },
      {
        slug: "impact",
        title: "Impact",
        seo: { description: "Engagements, invited talks, and public work." },
        nav: {
          label: "Impact",
          children: [
            { label: "Engagements", anchor: "engagements" },
            { label: "Invited talks", anchor: "talks" },
          ],
        },
        blocks: [
          {
            type: "hero",
            variant: "banner",
            tone: "invert",
            textured: true,
            eyebrow: "IMPACT",
            title: "Building bridges.\nAdvancing dialogue.",
            description: "Engagements, talks, and programs that carry the work into the rooms where decisions are made.",
          },
          {
            type: "tabs",
            tone: "muted",
            id: "engagements",
            items: [
              {
                label: "Engagements",
                icon: "Handshake",
                blocks: [
                  {
                    type: "masterDetail",
                    kicker: "FEATURED ENGAGEMENTS",
                    items: [
                      {
                        title: "First engagement",
                        meta: ["City, Country", "Month 00, 2026"],
                        detail: {
                          eyebrow: "ENGAGEMENT",
                          rows: [
                            { title: "Overview", body: "What the engagement was and who it convened.", icon: "Target" },
                            { title: "Approach", body: "What was presented, moderated, or facilitated.", icon: "Users" },
                            { title: "Impact & value", body: "What changed because of it.", icon: "BarChart3" },
                          ],
                        },
                      },
                    ],
                    viewAllLabel: "View all engagements",
                    viewAllHref: "#",
                  },
                ],
              },
              {
                label: "Invited talks",
                icon: "Mic",
                blocks: [
                  {
                    type: "masterDetail",
                    kicker: "FEATURED TALKS",
                    items: [
                      {
                        title: "First talk",
                        meta: ["Institution, City", "Month 00, 2026"],
                        icon: "Mic",
                        detail: {
                          eyebrow: "INVITED TALK",
                          rows: [
                            { title: "Overview", body: "What the talk covered.", icon: "Target" },
                            { title: "Approach", body: "How the material connected with the audience.", icon: "Users" },
                            { title: "Impact & value", body: "What it sparked.", icon: "BarChart3" },
                          ],
                        },
                      },
                    ],
                    viewAllLabel: "View all talks",
                    viewAllHref: "#",
                  },
                ],
              },
            ],
          },
          {
            type: "quote",
            tone: "base",
            text: "a closing line in the site's script accent",
            script: true,
          },
          {
            type: "cta",
            tone: "invert",
            textured: true,
            heading: "Work with us",
            buttons: [{ label: "Get in touch", href: "/contact" }],
          },
        ],
      },
    ],
  },
};
