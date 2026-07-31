import type { AbstractIntlMessages } from "next-intl";
import { hasModule, type SiteModule } from "@/config/site";

/**
 * Message namespaces owned by an optional module. `getMessages()` returns the
 * whole `messages/<locale>.json`, and everything handed to
 * `NextIntlClientProvider` is serialized into the HTML of *every* page — so
 * without this filter a client build ships the copy for every module it
 * doesn't use, including the reference build's founder/brand text. That is
 * both dead payload and a real content leak (another person's biography
 * sitting in this client's page source, viewable and scrapable).
 *
 * Namespaces absent from this map are core (always kept): `common`, `nav`,
 * `footer`, `metadata`, `about`, `contact`, `notFound`, `legal`.
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
 * Namespaces used only by the engine's default home composition. A site whose
 * `pages` module supplies a composed `home` page never renders it (see
 * `src/app/[locale]/page.tsx`), so its copy is dead payload there.
 */
const DEFAULT_HOME_NAMESPACES = ["home"] as const;

/**
 * Drop message namespaces this site can't reach. Keeps the client payload to
 * the copy the build actually renders.
 *
 * `hasComposedHome` should be true when a composed `home` page replaces the
 * default composition.
 */
export function filterMessages(
  messages: AbstractIntlMessages,
  { hasComposedHome }: { hasComposedHome: boolean },
): AbstractIntlMessages {
  const drop = new Set<string>();

  for (const [namespace, module] of Object.entries(MODULE_NAMESPACES)) {
    if (!hasModule(module)) drop.add(namespace);
  }
  if (hasComposedHome) for (const ns of DEFAULT_HOME_NAMESPACES) drop.add(ns);

  if (drop.size === 0) return messages;
  return Object.fromEntries(Object.entries(messages).filter(([ns]) => !drop.has(ns)));
}
