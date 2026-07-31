import { notFound } from "next/navigation";
import { hasModule, type SiteModule } from "@/config/site";

/**
 * Guard a route by module. Call at the top of a module route's server
 * `layout.tsx`; it renders the 404 page when that module is disabled in
 * `site.modules`. This is what makes `site.modules` authoritative for which
 * pages a given site actually exposes.
 *
 * ⚠️ DO NOT add a `loading.tsx` at the `app/[locale]` root. Doing so wraps
 * every nested route in a Suspense boundary, which makes Next stream the
 * response — the HTTP status is committed before this guard's `notFound()`
 * runs, so disabled-module routes serve the 404 *page body* with a **200**
 * status. That silently makes every disabled route crawlable/indexable as
 * real content. There was such a file here; removing it is what let these
 * routes return a true 404 (verified: `/music` 200 → 404, and the prerender
 * manifest now records `"status": 404`). A route-level `loading.tsx` further
 * down the tree is fine — just not one that wraps the module guards.
 */
export function requireModule(m: SiteModule): void {
  if (!hasModule(m)) notFound();
}
