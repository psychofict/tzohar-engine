/**
 * CLIENT PAGES — the one place the engine reaches into a client's own code.
 *
 * A client repo may hold code written for that client alone under `src/custom/`
 * (`CLIENT_CODE_PREFIX` in packages/schema/src/engine.ts). That directory is the
 * client's: a sync never writes or deletes it, and it transfers to the client on
 * payment. The engine reads exactly one file from it, `src/custom/pages.tsx`,
 * which exports `customPages`: the client's own pages, keyed by slug.
 *
 * The import below goes through the `@custom/*` alias in tsconfig.json, which
 * tries `src/custom/pages` first and falls back to `./custom-none/pages.ts`, an
 * empty list. So a repo with no `src/custom/` builds exactly as before, and a
 * sync never has to create anything on the client's side to keep it building.
 * The alias is a wildcard on purpose: Next's config loader refuses a fixed alias
 * with two locations (it panicked on Next 16.3.3).
 *
 * Client pages are served by the composed-pages route (`[locale]/[slug]`), so a
 * site needs the `pages` module for them to answer, and they inherit the site's
 * layout, theme, locale and navigation bar like any other page. A client page
 * wins over a composed page of the same slug; that is also how one gets a tab in
 * the bar (a composed page with that slug and a `nav` entry). Built-in module
 * routes win over both, and the slug `home` is not available.
 */
import type { ReactNode } from "react";
import { customPages as declared } from "@custom/pages";

export interface CustomPage {
  /** Browser-tab and search-result title. */
  title: string;
  /** Search-result description. Falls back to the site's own. */
  description?: string;
  /** The page itself. A server component; async is fine. */
  component: (props: { locale: string }) => ReactNode | Promise<ReactNode>;
}

export type CustomPages = Readonly<Record<string, CustomPage>>;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The client's pages with usable slugs. A malformed slug is dropped, not routed. */
export const customPages: CustomPages = Object.fromEntries(
  Object.entries(declared ?? {}).filter(([slug]) => SLUG.test(slug) && slug !== "home"),
);

export const customPageSlugs: readonly string[] = Object.keys(customPages);

export function getCustomPage(slug: string): CustomPage | undefined {
  return Object.hasOwn(customPages, slug) ? customPages[slug] : undefined;
}
