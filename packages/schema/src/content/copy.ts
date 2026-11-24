import { z } from "zod";

/**
 * Page COPY overrides — a curated subset of the engine's next-intl message keys
 * (namespace → key → string) that clients can edit in Studio. On publish, these
 * are DEEP-MERGED into the client repo's `messages/<locale>.json`; untouched
 * keys keep the engine's defaults, so the engine needs no code change. Only the
 * fields in `COPY_FIELDS` are surfaced in the editor.
 */
export const copySchema = z.object({
  common: z.record(z.string(), z.string()).optional(),
  home: z.record(z.string(), z.string()).optional(),
  footer: z.record(z.string(), z.string()).optional(),
  contact: z.record(z.string(), z.string()).optional(),
  about: z.record(z.string(), z.string()).optional(),
  // Search and share text per page (read on the server only, never shipped to the browser).
  metadata: z.record(z.string(), z.string()).optional(),
  // The posts module's index and post pages (24 Nov 2026).
  posts: z.record(z.string(), z.string()).optional(),
  // The gallery module's page.
  gallery: z.record(z.string(), z.string()).optional(),
});

export type CopyContent = z.infer<typeof copySchema>;

export interface CopyField {
  ns: "common" | "home" | "footer" | "contact" | "about" | "metadata" | "posts" | "gallery";
  key: string;
  label: string;
  help?: string;
  multiline?: boolean;
  /**
   * The module whose page shows this text. A field with a module is only seen on a site that runs
   * it, so an editor may leave it out for other sites. Fields without one are on core pages.
   */
  module?: "posts" | "gallery";
}

/** The homepage strings worth editing per-client (label + which message key). */
export const COPY_FIELDS: readonly CopyField[] = [
  { ns: "home", key: "location", label: "Hero eyebrow", help: "Small line above your name (e.g. a location or status)." },
  { ns: "home", key: "heroTagline", label: "Hero tagline", help: "The big line under your name." },
  { ns: "home", key: "heroCredibility", label: "Hero credibility line", help: "A short proof line under the tagline." },
  { ns: "common", key: "exploreMyWork", label: "Primary button label" },
  { ns: "common", key: "getInTouch", label: "Secondary button label" },
  { ns: "home", key: "whatIDo", label: "Sections kicker", help: 'Small label above "Where I operate".' },
  { ns: "home", key: "whereIOperate", label: "Sections heading" },
  { ns: "home", key: "whereIOperateDesc", label: "Sections description", multiline: true },
  { ns: "home", key: "letsBuild", label: "Closing CTA heading" },
  { ns: "home", key: "collabDesc", label: "Closing CTA subtext", multiline: true },
  // The footer runs under EVERY page, including a site composed entirely of
  // `pages` where none of the home fields above are rendered at all — and the
  // template's placeholder for it reads "Replace this in Studio.", which was an
  // instruction Studio could not carry out. A live demo site published it.
  { ns: "footer", key: "tagline", label: "Footer blurb", help: "The line under the logo in the footer, on every page.", multiline: true },
  // The other two placeholders that say "Replace this in Studio" out loud, on
  // core routes every site has: /contact's opening paragraph and /about's first
  // line. Both were live on the demo build.
  { ns: "contact", key: "intro", label: "Contact intro", help: "The paragraph above the enquiry tabs on /contact.", multiline: true },
  { ns: "about", key: "bioIntro", label: "About — opening paragraph", help: "The first paragraph of /about.", multiline: true },
  // /contact's four questions ship as instructions to the site owner ("Set expectations on lead
  // time here"), and a visitor reads them the moment they open a question. The Kopje Light demo
  // published all four, so they are editable like the three placeholders above. The availability
  // line beside the contact details reads "Available worldwide" on every site until it is set; its
  // message lives in `common`, not `contact`, which is where the page reads it from.
  { ns: "contact", key: "faq1Q", label: "Contact FAQ 1 — question", help: "Shown under Frequently Asked Questions on /contact." },
  { ns: "contact", key: "faq1A", label: "Contact FAQ 1 — answer", multiline: true },
  { ns: "contact", key: "faq2Q", label: "Contact FAQ 2 — question" },
  { ns: "contact", key: "faq2A", label: "Contact FAQ 2 — answer", multiline: true },
  { ns: "contact", key: "faq3Q", label: "Contact FAQ 3 — question" },
  { ns: "contact", key: "faq3A", label: "Contact FAQ 3 — answer", multiline: true },
  { ns: "contact", key: "faq4Q", label: "Contact FAQ 4 — question" },
  { ns: "contact", key: "faq4A", label: "Contact FAQ 4 — answer", multiline: true },
  { ns: "common", key: "availableWorldwide", label: "Availability line", help: "Beside the contact details on /contact, under Availability." },
  // The rest of the words a ceramics studio found it could not change (audit of 24 Nov 2026).
  // The pages already read the contact and about keys; the footer, metadata, posts and gallery
  // keys are read with a fallback, so a site whose messages file predates them keeps working.
  { ns: "footer", key: "reach", label: "Footer reach line", help: "Printed after the place you are based in, at the foot of every page, e.g. Worldwide." },
  { ns: "contact", key: "contactLabel", label: "Contact page eyebrow", help: "The small label above the title on /contact." },
  { ns: "contact", key: "title", label: "Contact page title" },
  { ns: "contact", key: "subtitle", label: "Contact page subtitle", help: "The line under the title on /contact." },
  { ns: "about", key: "aboutHeading", label: "About page heading", help: "The large line beside your picture on /about." },
  { ns: "about", key: "letsBuildTitle", label: "About page closing heading", help: "The heading of the band at the end of /about." },
  { ns: "about", key: "letsBuildDesc", label: "About page closing text", help: "The line under that heading, above the contact button.", multiline: true },
  { ns: "metadata", key: "aboutDescription", label: "About page search description", help: "What search engines and shared links show for /about. About 150 characters.", multiline: true },
  { ns: "metadata", key: "contactDescription", label: "Contact page search description", help: "What search engines and shared links show for /contact. About 150 characters.", multiline: true },
  { ns: "posts", key: "eyebrow", label: "Post index eyebrow", help: "The small label above the title of the post index.", module: "posts" },
  { ns: "posts", key: "title", label: "Post index title", module: "posts" },
  { ns: "posts", key: "subtitle", label: "Post index subtitle", help: "The line under the title of the post index, also used in its search description.", module: "posts" },
  { ns: "posts", key: "backLabel", label: "Back link on a post", help: "The link at the top of each post that leads back to the index.", module: "posts" },
  { ns: "posts", key: "moreHeading", label: "More posts heading", help: "The label over other posts at the end of each post.", module: "posts" },
  { ns: "gallery", key: "title", label: "Gallery title", module: "gallery" },
  { ns: "gallery", key: "subtitle", label: "Gallery subtitle", help: "The line under the title of /gallery.", module: "gallery" },
  { ns: "metadata", key: "galleryDescription", label: "Gallery search description", help: "What search engines and shared links show for /gallery.", multiline: true, module: "gallery" },
] as const;

/** Read a copy value from a CopyContent object for a given field. */
export function copyValue(copy: CopyContent | undefined, f: CopyField): string {
  return copy?.[f.ns]?.[f.key] ?? "";
}
