import { site } from "@/config/site";
import { isPreviewBuild } from "@/lib/preview-build";

/**
 * Whether search engines may list this site.
 *
 * Two ways to say no. A preview build (TZOHAR_PREVIEW=1) always does, and it also closes the
 * contact form, sign-ups and checkout (src/lib/preview-build.ts). `site.seo.index: false` says
 * no on its own, for a launched site that wants its forms open but is not ready to be found.
 * Either way the pages carry a noindex, nofollow robots tag, next.config.ts adds the same
 * X-Robots-Tag header, and robots.txt names no sitemap.
 */
export const siteIndexable: boolean = !isPreviewBuild && site.seo.index !== false;
