/**
 * Limits for the Spotify routes (security review TZS-11, EBE-6328).
 *
 * /api/spotify-artist/[id] and /api/spotify-albums call Spotify with the site's own app
 * credentials. Before this they fetched any id a caller named, with no limit, so anyone could use
 * a client site as a free Spotify proxy and push its Spotify app into Spotify's rate limits, which
 * breaks the site's own music and label pages; their in-memory caches also grew without a bound.
 *
 * Now a route fetches only ids the site's own data names (the roster's artists, the releases'
 * albums), keeps answers in a cache with a size cap and a fixed expiry, and counts every request
 * that would reach Spotify per caller address in the site's counter store (src/lib/mail-guard.ts:
 * Redis when configured, else this instance's memory). A cached answer is served without counting.
 */
import { releases } from "@/data/releases";
import { rosterArtistIds } from "@/data/roster";
import { site } from "@/config/site";
import { callerAddress, counterStore } from "@/lib/mail-guard";

/** Requests one caller may send that reach Spotify, per hour. The site's own pages make one per
 *  page view at most, and a cached answer does not count. */
export const SPOTIFY_CALLER_MAX = 30;
const SPOTIFY_CALLER_WINDOW_SECONDS = 60 * 60;

/** Artist ids the site's label roster names. */
export function knownArtistIds(): ReadonlySet<string> {
  return new Set(rosterArtistIds.filter(Boolean));
}

/** Album ids the site's discography names (a release's spotifyId, or the id in an album URI). */
export function knownAlbumIds(): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const r of releases) {
    if (r.spotifyId) ids.add(r.spotifyId);
    const m = /^album\/([A-Za-z0-9]+)$/.exec(r.spotifyUri ?? "");
    if (m) ids.add(m[1]);
  }
  return ids;
}

/**
 * A cache with a size cap and a fixed expiry per entry: an entry lives `ttlMs` from when it was
 * stored, whatever is added later, and the oldest entry goes once the cap is reached.
 */
export class BoundedCache<T> {
  private entries = new Map<string, { value: T; expiresAt: number }>();
  constructor(private readonly maxEntries: number, private readonly ttlMs: number) {}

  get(key: string, now: number = Date.now()): T | undefined {
    const e = this.entries.get(key);
    if (!e) return undefined;
    if (e.expiresAt <= now) {
      this.entries.delete(key);
      return undefined;
    }
    return e.value;
  }

  set(key: string, value: T, now: number = Date.now()): void {
    this.entries.delete(key);
    if (this.entries.size >= this.maxEntries) {
      for (const [k, v] of this.entries) if (v.expiresAt <= now) this.entries.delete(k);
    }
    while (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
    this.entries.set(key, { value, expiresAt: now + this.ttlMs });
  }

  get size(): number {
    return this.entries.size;
  }
}

/** How long an id Spotify would not answer for is left alone, so a deleted or region-locked
 *  release does not send every page view back to Spotify. */
export const SPOTIFY_MISS_TTL_MS = 60 * 60 * 1000;

/**
 * While Spotify is limiting the site's app (a 429) or failing (5xx), every route waits before
 * asking it again: Spotify's Retry-After, or a minute, at most ten. Per instance, like the caches.
 */
let restUntil = 0;
export function spotifyResting(now: number = Date.now()): boolean {
  return now < restUntil;
}
/** Note a Spotify answer; a 429 or 5xx starts the wait. */
export function noteSpotifyAnswer(res: Response, now: number = Date.now()): void {
  if (res.status !== 429 && res.status < 500) return;
  const after = Number(res.headers.get("retry-after"));
  const seconds = Number.isFinite(after) && after > 0 ? Math.min(after, 600) : 60;
  restUntil = Math.max(restUntil, now + seconds * 1000);
}
/** Tests only. */
export function resetSpotifyRestForTests(): void {
  restUntil = 0;
}

export type SpotifyVerdict = { ok: true } | { ok: false; status: 429 | 503 };

/** Count one request that would reach Spotify for this caller; refuse past the hourly limit, and
 *  when the counter store does not answer (fail closed: no count, no Spotify call). */
export async function allowSpotifyCall(req: Request): Promise<SpotifyVerdict> {
  let scope: string;
  try {
    scope = new URL(site.url).host;
  } catch {
    scope = site.name;
  }
  try {
    const n = await counterStore().hit(`tzspotify:${scope}:caller:${callerAddress(req)}`, SPOTIFY_CALLER_WINDOW_SECONDS);
    return n > SPOTIFY_CALLER_MAX ? { ok: false, status: 429 } : { ok: true };
  } catch (e) {
    console.error("Spotify limiter store failed:", e instanceof Error ? e.message : e);
    return { ok: false, status: 503 };
  }
}
