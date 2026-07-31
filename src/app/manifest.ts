import type { MetadataRoute } from "next";
import { site } from "@/config/site";

/**
 * The web app manifest, generated from config.
 *
 * It used to be a STATIC `public/manifest.json`, and `public/` is client-owned —
 * which meant every client repo generated from the template carried the reference
 * build's manifest and never replaced it. The first real client's live site was
 * therefore serving, and offering to install as an app:
 *
 *     name: <the reference build>, categories: ["music", "entertainment"],
 *     description: "Official website of … — Zimbabwean music producer …"
 *
 * on their own domain. A file nobody looks at is exactly the file that stays
 * wrong, so identity does not belong in copied static content: as a route it is
 * engine code, correct for every client by construction, and it updates when they
 * rename themselves.
 *
 * Next serves this at `/manifest.webmanifest`.
 */
export default function manifest(): MetadataRoute.Manifest {
  const dark = site.appearance?.mode === "dark";
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: site.locales.default,
    dir: "ltr",
    // Follows the site's own light/dark preference rather than a fixed near-black,
    // which is what made an installed light-themed site open on a dark splash.
    background_color: dark ? "#0E0E10" : "#FFFFFF",
    theme_color: dark ? "#0E0E10" : "#FFFFFF",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
