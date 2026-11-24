/**
 * An address a search engine can follow: a path on the site gets the site's origin in front,
 * a full address is left alone.
 *
 * The JSON-LD put `site.url` in front of every picture, which was right while pictures were
 * files in `public/` and wrong once Studio stored them on Cloudinary: the Kopje Light demo
 * published "https://demo-kopje-light.studio.ebenworks.cohttps://res.cloudinary.com/...".
 */
export function absoluteUrl(src: string, origin: string): string {
  const s = src.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  const base = origin.replace(/\/+$/, "");
  return `${base}${s.startsWith("/") ? s : `/${s}`}`;
}
