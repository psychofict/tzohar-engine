import type { AbstractIntlMessages } from "next-intl";
import { hasModule, site, type SiteModule } from "@/config/site";
import { isPreviewBuild } from "@/lib/preview-build";

/**
 * Message namespaces owned by an optional module. `getMessages()` returns the
 * whole `messages/<locale>.json`, and everything handed to
 * `NextIntlClientProvider` is serialized into the HTML of *every* page — so
 * without this filter a client build ships the copy for every module it
 * doesn't use, including the reference build's founder/brand text. That is
 * both dead payload and a real content leak (another person's biography
 * sitting in this client's page source, viewable and scrapable).
 *
 * Namespaces absent from this map and from SERVER_ONLY_NAMESPACES are core and
 * kept, though the keys of a few of them (`nav`, `footer`, `contact`) are
 * trimmed below.
 */
const MODULE_NAMESPACES: Record<string, SiteModule> = {
  music: "music",
  release: "music",
  tour: "tour",
  macroInfluencer: "influencer",
  label: "label",
  merch: "merch",
  links: "links",
  gallery: "gallery",
  vault: "vault",
  plans: "membership",
  account: "membership",
  ai: "ai",
  research: "research",
  engagements: "engagements",
  innovation: "innovation",
  biography: "biography",
  press: "press",
};

/**
 * Namespaces that only server code reads, through `getTranslations`, which
 * takes the full messages file rather than the provider's copy: page metadata
 * (`metadata`, read by the route layouts), the post index and post pages
 * (`posts`) and the localised 404 (`notFound`). No client component asks for
 * them, so they never need to reach the browser. `metadata` alone held the
 * search titles and descriptions of every module the reference build runs.
 */
const SERVER_ONLY_NAMESPACES = ["metadata", "posts", "notFound"] as const;

/**
 * Namespaces used only by the engine's default home composition. A site whose
 * `pages` module supplies a composed `home` page never renders it (see
 * `src/app/[locale]/page.tsx`), so its copy is dead payload there.
 */
const DEFAULT_HOME_NAMESPACES = ["home"] as const;

/**
 * Keys of the `nav` namespace that label one module's menu entries
 * (src/config/navigation.ts and the footer's sitemap columns). A site without
 * the module shows none of them. `home`, `about` and `contact` are core.
 * `overview` is shared by the AI and influencer groups, so it goes only when
 * both are off.
 */
const NAV_KEYS_BY_MODULE: Partial<Record<SiteModule, readonly string[]>> = {
  music: ["music", "musicOverview", "discography", "topTracks", "singles", "fullWebsite"],
  tour: ["tour"],
  merch: ["merch"],
  label: ["recordLabel"],
  ai: ["ai", "aiEngineering", "publications", "projects", "experience", "education"],
  research: ["research", "researchOverview", "researchInterests", "researchPublications", "researchCredentials"],
  innovation: ["innovation"],
  engagements: ["engagements"],
  influencer: ["influence", "macroInfluencer", "brandPartnerships", "governmentRoles", "travelCampaigns", "events", "inTheSpotlight"],
  press: ["press"],
  membership: ["membership", "plans", "signIn", "account"],
  vault: ["vault"],
  gallery: ["gallery"],
  links: ["links"],
  biography: ["biography"],
};

/** Keys of the `footer` namespace that belong to one module's sitemap entry. */
const FOOTER_KEYS_BY_MODULE: Partial<Record<SiteModule, readonly string[]>> = {
  tour: ["tourDates"],
  ai: ["aiMlEngineer"],
};

/** The footer's newsletter heading and text, read only while the footer shows the form. */
const FOOTER_NEWSLETTER_KEYS = ["newsletter", "newsletterDesc", "emailPlaceholder"] as const;

/**
 * The contact page's inquiry forms (src/app/[locale]/contact/page.tsx). Each
 * inquiry type has a tab label under its own id; `booking` and `speaking`
 * share the event form, `collaborations` and `research` the collaboration
 * form. A form's keys go when no tab that uses it is offered, so a site that
 * takes only general messages no longer ships "Submit demo" and "Your artist /
 * stage name".
 */
export const CONTACT_INQUIRIES = [
  "booking",
  "speaking",
  "press",
  "collaborations",
  "research",
  "labelSubmissions",
  "general",
] as const;
export type ContactInquiry = (typeof CONTACT_INQUIRIES)[number];

const CONTACT_FORM_KEYS: Record<"event" | "press" | "collab" | "research" | "label" | "general", readonly string[]> = {
  event: [
    "eventType", "date", "location", "eventTypePlaceholder", "cityVenue", "tellAboutEvent", "submitBooking",
    "bookingSuccess", "budgetRange", "selectBudget", "under1k", "range1k5k", "range5k10k", "range10k25k", "range25kPlus",
  ],
  press: ["outletName", "deadline", "topic", "publicationOutlet", "youAtOutlet", "whatCover", "submitPress", "pressSuccess"],
  collab: [
    "collaborationType", "collabTypePlaceholder", "links", "portfolioLinks", "tellAboutCollab", "submitCollab",
    "collabSuccess", "artistBrandName", "nameOrBrand",
  ],
  // The collaboration form under its research tab asks for a name or an institution.
  research: ["institutionName", "nameOrInstitution"],
  label: [
    "artistName", "stageName", "genre", "genrePlaceholder", "linksToMusic", "musicLinksPlaceholder", "tellAboutMusic",
    "submitDemo", "demoSuccess",
  ],
  general: ["whatsOnMind", "sendMessage", "generalSuccess"],
};

/** Which form groups each tab renders. */
const CONTACT_FORMS_OF: Record<ContactInquiry, readonly (keyof typeof CONTACT_FORM_KEYS)[]> = {
  booking: ["event"],
  speaking: ["event"],
  press: ["press"],
  collaborations: ["collab"],
  research: ["collab", "research"],
  labelSubmissions: ["label"],
  general: ["general"],
};

/** Field labels more than one form uses. */
const CONTACT_SHARED_FORM_KEYS = ["name", "email", "message", "yourName", "youAtExample"] as const;

/** The facts about a site that decide which messages its pages can reach. */
export interface MessageFilterFacts {
  /** Whether the site runs a module. */
  hasModule: (module: SiteModule) => boolean;
  /** A composed `home` page replaces the default home composition. */
  hasComposedHome: boolean;
  /** `site.contact.inquiries`, when the site sets it. */
  inquiries?: readonly string[];
  /** A preview build closes the contact form and the newsletter. */
  preview: boolean;
  /** The footer shows its newsletter form. */
  footerNewsletter: boolean;
  /** `site.location.based` is set, so the contact page never prints its "City, Country" fallback. */
  hasBasedIn: boolean;
}

/**
 * The inquiry tabs the contact page renders, worked out the way its
 * `useInquiryTabs` does: the configured list (or every type), narrowed to the
 * tabs whose label is in the messages file, with `general` as the floor. A
 * preview build renders no form, so none.
 */
export function offeredInquiries(contact: AbstractIntlMessages | undefined, facts: MessageFilterFacts): ContactInquiry[] {
  if (facts.preview) return [];
  const known = (k: string): k is ContactInquiry => (CONTACT_INQUIRIES as readonly string[]).includes(k);
  const candidates = facts.inquiries ? facts.inquiries.filter(known) : [...CONTACT_INQUIRIES];
  const withCopy = candidates.filter((k) => contact !== undefined && k in contact);
  return withCopy.length > 0 ? withCopy : ["general"];
}

/** The keys to remove from each kept namespace. */
function droppedKeys(messages: AbstractIntlMessages, facts: MessageFilterFacts): Record<string, Set<string>> {
  const nav = new Set<string>();
  for (const [module, keys] of Object.entries(NAV_KEYS_BY_MODULE) as [SiteModule, readonly string[]][]) {
    if (!facts.hasModule(module)) for (const k of keys) nav.add(k);
  }
  if (!facts.hasModule("ai") && !facts.hasModule("influencer")) nav.add("overview");

  const footer = new Set<string>();
  for (const [module, keys] of Object.entries(FOOTER_KEYS_BY_MODULE) as [SiteModule, readonly string[]][]) {
    if (!facts.hasModule(module)) for (const k of keys) footer.add(k);
  }
  if (!facts.footerNewsletter || facts.preview) for (const k of FOOTER_NEWSLETTER_KEYS) footer.add(k);

  const contactMessages = messages.contact as AbstractIntlMessages | undefined;
  const offered = offeredInquiries(contactMessages, facts);
  const formsKept = new Set(offered.flatMap((tab) => CONTACT_FORMS_OF[tab]));
  const contact = new Set<string>();
  for (const tab of CONTACT_INQUIRIES) if (!offered.includes(tab)) contact.add(tab);
  for (const [form, keys] of Object.entries(CONTACT_FORM_KEYS)) {
    if (!formsKept.has(form as keyof typeof CONTACT_FORM_KEYS)) for (const k of keys) contact.add(k);
  }
  // A key two forms share stays while either form is kept.
  for (const form of formsKept) for (const k of CONTACT_FORM_KEYS[form]) contact.delete(k);
  if (offered.length === 0) for (const k of CONTACT_SHARED_FORM_KEYS) contact.add(k);
  // The note that replaces the form, read only on a preview build.
  if (!facts.preview) contact.add("previewFormNote");
  if (facts.hasBasedIn) contact.add("seoulKorea");

  return { nav, footer, contact };
}

/**
 * Drop the messages this site's pages cannot reach, given the facts about the
 * site. Pure, so scripts/messages-filter.test.ts can try it on made-up sites.
 */
export function filterMessagesFor(messages: AbstractIntlMessages, facts: MessageFilterFacts): AbstractIntlMessages {
  const drop = new Set<string>(SERVER_ONLY_NAMESPACES);
  for (const [namespace, module] of Object.entries(MODULE_NAMESPACES)) {
    if (!facts.hasModule(module)) drop.add(namespace);
  }
  if (facts.hasComposedHome) for (const ns of DEFAULT_HOME_NAMESPACES) drop.add(ns);

  const trim = droppedKeys(messages, facts);
  const out: AbstractIntlMessages = {};
  for (const [ns, value] of Object.entries(messages)) {
    if (drop.has(ns)) continue;
    const keys = trim[ns];
    if (keys && keys.size > 0 && value && typeof value === "object") {
      out[ns] = Object.fromEntries(Object.entries(value).filter(([k]) => !keys.has(k)));
    } else {
      out[ns] = value;
    }
  }
  return out;
}

/**
 * Drop message namespaces and keys this site can't reach. Keeps the client
 * payload to the copy the build actually renders.
 *
 * `hasComposedHome` should be true when a composed `home` page replaces the
 * default composition.
 */
export function filterMessages(
  messages: AbstractIntlMessages,
  { hasComposedHome }: { hasComposedHome: boolean },
): AbstractIntlMessages {
  return filterMessagesFor(messages, {
    hasModule,
    hasComposedHome,
    inquiries: site.contact?.inquiries,
    preview: isPreviewBuild,
    footerNewsletter: site.layout?.footerNewsletter !== false,
    hasBasedIn: Boolean(site.location?.based),
  });
}
