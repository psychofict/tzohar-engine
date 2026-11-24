import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { siteIndexable } from "@/lib/search-index";

/**
 * `site.url`, not a hardcoded host. This file named the reference build's host
 * build's domain — so every forked client site published a robots.txt pointing
 * crawlers at a sitemap on somebody else's domain.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = site.url;
  // A site kept out of search (a preview build, or `seo.index: false`). Crawlers may still
  // fetch its pages, so they read the noindex tag and header: a URL blocked here can still be
  // listed bare when something links to it, because the crawler never sees the noindex. It
  // names no sitemap.
  if (!siteIndexable) return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] }] };

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // `/admin` is the CRM. It is already behind a password, but there is no
        // reason for it to be in an index, and a crawler hitting it only ever
        // gets the login screen.
        disallow: ["/api/", "/admin"],
      },
      {
        userAgent: "Yeti",
        allow: "/",
        disallow: ["/api/", "/admin"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
