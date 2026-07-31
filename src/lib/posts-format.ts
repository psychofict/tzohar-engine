/**
 * Post presentation helpers — deliberately free of any import of the posts
 * store, so a client component can format a date without pulling `posts.json`
 * (and every article body) into the browser bundle.
 */

/** Long-form date for a post's ISO `date`. Fixed locale + UTC so SSR and the
 *  client render the same string and React doesn't report a hydration mismatch. */
export function formatPostDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y) return iso;
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
