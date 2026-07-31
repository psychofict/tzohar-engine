import type { MetadataRoute } from "next";
import { releases } from "@/data/releases";
import { rosterArtistIds } from "@/data/roster";
import { routedPages } from "@/data/pages";
import { posts } from "@/data/posts";
import { site, hasModule } from "@/config/site";

/**
 * Sitemap built from what this site actually serves.
 *
 * Two things were wrong here and both mislead crawlers on any forked build:
 * the host was hardcoded to the reference site's domain, and the page list was a
 * fixed roster of the reference site's module routes. On a build whose modules
 * are `pages` + `posts`, that advertised a dozen URLs that 404 and none of the
 * ones that exist. Paths are now derived from the enabled modules and the actual
 * content, and locales from `site.locales.enabled` rather than the engine's full
 * supported set.
 */

const enabledLocales = site.locales.enabled;
const defaultLocale = site.locales.default;

function localeUrl(baseUrl: string, path: string, locale: string) {
  return locale === defaultLocale ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`;
}

function makeAlternates(baseUrl: string, path: string) {
  return {
    languages: Object.fromEntries(enabledLocales.map((l) => [l, localeUrl(baseUrl, path, l)])),
  };
}

type Freq = "weekly" | "monthly" | "yearly";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = site.url;
  const now = new Date().toISOString().split("T")[0];

  // Core routes exist on every build; module routes are added only when on.
  const staticPaths: { path: string; freq: Freq; priority: number }[] = [
    { path: "/", freq: "weekly", priority: 1 },
    { path: "/about", freq: "monthly", priority: 0.8 },
    { path: "/contact", freq: "yearly", priority: 0.5 },
    { path: "/privacy", freq: "yearly", priority: 0.2 },
  ];

  const modulePaths: { path: string; freq: Freq; priority: number; module: Parameters<typeof hasModule>[0] }[] = [
    { path: "/music", freq: "weekly", priority: 0.9, module: "music" },
    { path: "/ai", freq: "monthly", priority: 0.8, module: "ai" },
    { path: "/research", freq: "monthly", priority: 0.8, module: "research" },
    { path: "/innovation", freq: "monthly", priority: 0.8, module: "innovation" },
    { path: "/engagements", freq: "monthly", priority: 0.8, module: "engagements" },
    { path: "/biography", freq: "monthly", priority: 0.8, module: "biography" },
    { path: "/label", freq: "monthly", priority: 0.7, module: "label" },
    { path: "/macro-influencer", freq: "monthly", priority: 0.7, module: "influencer" },
    { path: "/press", freq: "monthly", priority: 0.7, module: "press" },
    { path: "/tour", freq: "weekly", priority: 0.6, module: "tour" },
    { path: "/gallery", freq: "monthly", priority: 0.6, module: "gallery" },
    { path: "/join", freq: "monthly", priority: 0.5, module: "membership" },
    { path: "/vault", freq: "monthly", priority: 0.4, module: "vault" },
    { path: "/links", freq: "monthly", priority: 0.4, module: "links" },
    { path: "/merch", freq: "monthly", priority: 0.3, module: "merch" },
    { path: "/posts", freq: "weekly", priority: 0.8, module: "posts" },
  ];

  for (const m of modulePaths) {
    if (hasModule(m.module)) staticPaths.push({ path: m.path, freq: m.freq, priority: m.priority });
  }

  // Composed pages (the `pages` module) are real routes; include them.
  if (hasModule("pages")) {
    for (const page of routedPages) {
      staticPaths.push({ path: `/${page.slug}`, freq: "monthly", priority: 0.8 });
    }
  }

  const staticPages: MetadataRoute.Sitemap = staticPaths.flatMap(({ path, freq, priority }) =>
    enabledLocales.map((locale) => ({
      url: localeUrl(baseUrl, path === "/" ? "" : path, locale) || baseUrl,
      lastModified: now,
      changeFrequency: freq,
      priority,
      alternates: makeAlternates(baseUrl, path === "/" ? "" : path),
    })),
  );

  // `posts` excludes drafts by construction, so an unpublished piece is never
  // advertised even though its URL resolves.
  const postPages: MetadataRoute.Sitemap = hasModule("posts")
    ? posts.map((post) => ({
        url: localeUrl(baseUrl, `/posts/${post.slug}`, defaultLocale),
        lastModified: post.date,
        changeFrequency: "yearly" as const,
        priority: 0.7,
        alternates: makeAlternates(baseUrl, `/posts/${post.slug}`),
      }))
    : [];

  const artistPages: MetadataRoute.Sitemap = hasModule("label")
    ? rosterArtistIds.map((id) => ({
        url: localeUrl(baseUrl, `/label/${id}`, defaultLocale),
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.5,
        alternates: makeAlternates(baseUrl, `/label/${id}`),
      }))
    : [];

  const releasePages: MetadataRoute.Sitemap = hasModule("music")
    ? releases.map((release) => ({
        url: localeUrl(baseUrl, `/music/${release.slug}`, defaultLocale),
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: makeAlternates(baseUrl, `/music/${release.slug}`),
      }))
    : [];

  return [...staticPages, ...postPages, ...artistPages, ...releasePages];
}
