/**
 * The Spotify routes are not a free Spotify proxy (security review TZS-11, EBE-6328).
 *
 * Before the fix /api/spotify-artist/[id] made four Spotify calls for any artist id a caller named,
 * and /api/spotify-albums up to fifty, with no limit, and their in-memory caches grew without a
 * bound (the albums cache's expiry moved on with every merge). This test fails on that code and
 * passes on the fix:
 *
 * - an artist or album id the site's own data does not name reaches no Spotify call;
 * - a caller gets at most SPOTIFY_CALLER_MAX requests through to Spotify an hour, whatever it
 *   writes in X-Forwarded-For, and a counter store that does not answer stops the call;
 * - a cached answer is served without a Spotify call and without counting;
 * - the cache keeps at most its cap and each entry expires a fixed time after it was stored.
 *
 * Run: npx --yes tsx scripts/spotify-routes.test.ts
 * No network: global fetch is replaced, so nothing reaches Spotify. The credentials are made up.
 * In a client repo without the music module the routes are absent and the test says so and passes.
 */
import { existsSync } from "node:fs";

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const ARTIST_ROUTE = "../src/app/api/spotify-artist/[id]/route";
const ALBUMS_ROUTE = "../src/app/api/spotify-albums/route";

process.env.SPOTIFY_CLIENT_ID = "made-up-client-id";
process.env.SPOTIFY_CLIENT_SECRET = "made-up-client-secret";
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.KV_REST_API_URL;

let spotifyCalls: string[] = [];
let artistMissing = false;
let albumMissing = false;
let spotifyFailing = false;
let listsFailing = false;
let spotifyLimiting = false;
let searchFailing = false;
globalThis.fetch = (async (input: unknown) => {
  const url = String(input instanceof Request ? input.url : input);
  const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json" } });
  if (url.startsWith("https://accounts.spotify.com/")) return json({ access_token: "made-up-token", expires_in: 3600 });
  if (url.startsWith("https://api.spotify.com/")) {
    spotifyCalls.push(url);
    const album = /\/v1\/albums\/([A-Za-z0-9]+)/.exec(url);
    if (spotifyFailing) return json({ error: { status: 403 } }, 403);
    if (spotifyLimiting) return new Response("{}", { status: 429, headers: { "retry-after": "120" } });
    if (searchFailing && /\/v1\/search/.test(url)) return json({ error: { status: 503 } }, 503);
    if (/\/v1\/search/.test(url)) return json({ artists: { items: [{ name: "Made-up Artist", images: [], external_urls: {} }] } });
    if (album && albumMissing) return json({ error: { status: 404 } }, 404);
    if (album) return json({ id: album[1], name: "Made-up Album", images: [], total_tracks: 3, release_date: "2026-01-01", label: "" });
    if (listsFailing && /\/(top-tracks|albums|related-artists)/.test(url)) return json({ error: { status: 503 } }, 503);
    if (artistMissing) return json({ error: { status: 404 } }, 404);
    if (/\/top-tracks/.test(url)) return json({ tracks: [] });
    if (/\/albums/.test(url)) return json({ items: [] });
    if (/\/related-artists/.test(url)) return json({ artists: [] });
    return json({ name: "Made-up Artist", images: [], external_urls: {}, followers: { total: 1 }, genres: [], popularity: 1 });
  }
  return json({ error: "no network in this test" }, 599);
}) as typeof fetch;

const from = (ip: string, url: string, extra: Record<string, string> = {}) => new Request(url, { headers: { "x-real-ip": ip, ...extra } });

async function main() {
  // A client repo may keep one route and not the other (the artist route serves the label module
  // too), so each is checked when its own file is there.
  const hasArtist = existsSync(new URL(`${ARTIST_ROUTE}.ts`, import.meta.url));
  const hasAlbums = existsSync(new URL(`${ALBUMS_ROUTE}.ts`, import.meta.url));
  if (!hasArtist && !hasAlbums) {
    console.log("The Spotify routes are not in this repository; nothing to check.");
    return;
  }
  const artistRoute = hasArtist ? await import(ARTIST_ROUTE) : null;
  const albumsRoute = hasAlbums ? await import(ALBUMS_ROUTE) : null;
  const { rosterArtistIds } = await import("../src/data/roster");
  const { releases } = await import("../src/data/releases");
  const mailGuard = await import("../src/lib/mail-guard");
  const artist = (ip: string, id: string, extra: Record<string, string> = {}) =>
    artistRoute!.GET(from(ip, `https://site.example.invalid/api/spotify-artist/${id}`, extra), { params: Promise.resolve({ id }) }) as Promise<Response>;
  const albums = (ip: string, ids: string) => albumsRoute!.GET(from(ip, `https://site.example.invalid/api/spotify-albums?ids=${ids}`)) as Promise<Response>;

  console.log("ids the site's data does not name");
  if (hasArtist) {
  spotifyCalls = [];
  const strangerArtist = await artist("198.51.100.1", "MadeUpArtistNotOnRoster0");
  check("an artist off the roster reaches no Spotify call", spotifyCalls.length === 0, `${spotifyCalls.length} Spotify calls, status ${strangerArtist.status}`);
  check("and is answered 404", strangerArtist.status === 404, `status ${strangerArtist.status}`);
  }
  if (hasAlbums) {
  spotifyCalls = [];
  const fifty = Array.from({ length: 50 }, (_, i) => `MadeUpAlbum${String(i).padStart(11, "0")}`).join(",");
  const strangerAlbums = await albums("198.51.100.2", fifty);
  check("fifty albums the discography does not name reach no Spotify call", spotifyCalls.length === 0, `${spotifyCalls.length} Spotify calls, status ${strangerAlbums.status}`);
  check("and are refused 400", strangerAlbums.status === 400, `status ${strangerAlbums.status}`);
  }

  // Loaded after the checks above, so on code without the guard those still run and fail.
  const guard = await import("../src/lib/spotify-guard");
  const rosterId = (rosterArtistIds as string[]).find(Boolean);
  const albumId = (releases as { spotifyId?: string }[]).map((r) => r.spotifyId).find(Boolean);

  if (rosterId && hasArtist) {
    console.log("an artist on the roster");
    mailGuard.useCounterStoreForTests(null);
    spotifyCalls = [];
    artistMissing = false;
    const first = await artist("198.51.100.3", rosterId);
    check("is looked up", first.status === 200 && spotifyCalls.length === 4, `status ${first.status}, ${spotifyCalls.length} calls`);
    spotifyCalls = [];
    const again = await artist("198.51.100.3", rosterId);
    check("a second request is served from the cache", again.status === 200 && spotifyCalls.length === 0, `${spotifyCalls.length} calls`);

    console.log("a counter store that does not answer");
    mailGuard.useCounterStoreForTests({
      durable: true,
      hit: async () => {
        throw new Error("made-up store failure");
      },
      forget: async () => {},
      peek: async () => 0,
    });
    const { allowSpotifyCall: allowWhileDown } = await import("../src/lib/spotify-guard");
    const verdict = await allowWhileDown(from("198.51.100.4", "https://site.example.invalid/"));
    check("the limiter answers 503", !verdict.ok && verdict.status === 503, JSON.stringify(verdict));
    const coldArtist = (rosterArtistIds as string[]).filter(Boolean)[2];
    if (coldArtist) {
      spotifyCalls = [];
      const down = await artist("198.51.100.4", coldArtist);
      check("an uncached artist is refused 503 with no Spotify request", down.status === 503 && spotifyCalls.length === 0, `status ${down.status}, ${spotifyCalls.length} calls`);
    }
    spotifyCalls = [];
    const cachedWhileDown = await artist("198.51.100.4", rosterId);
    check("a cached artist is still served", cachedWhileDown.status === 200 && spotifyCalls.length === 0, `status ${cachedWhileDown.status}`);
    mailGuard.useCounterStoreForTests(null);

    console.log("an artist whose lists fail for a moment");
    const flaky = (rosterArtistIds as string[]).filter(Boolean)[4];
    if (flaky) {
      listsFailing = true;
      const partial = await artist("198.51.100.9", flaky);
      listsFailing = false;
      guard.resetSpotifyRestForTests(); // the 503s above started the wait
      spotifyCalls = [];
      const next = await artist("198.51.100.9", flaky);
      check(
        "the partial answer is sent uncached and the next request asks again",
        partial.status === 200 && partial.headers.get("cache-control") === "no-store" && spotifyCalls.length === 4 && /s-maxage/.test(next.headers.get("cache-control") ?? ""),
        `${partial.headers.get("cache-control")}, then ${spotifyCalls.length} calls`,
      );
    }

    const resting = (rosterArtistIds as string[]).filter(Boolean)[5];
    if (resting) {
      console.log("while Spotify limits the site's app");
      spotifyLimiting = true;
      await artist("198.51.100.10", resting);
      spotifyLimiting = false;
      spotifyCalls = [];
      const waiting = await artist("198.51.100.11", resting);
      check("nobody's request goes to Spotify until its Retry-After has passed", waiting.status === 503 && spotifyCalls.length === 0 && guard.spotifyResting(), `status ${waiting.status}, ${spotifyCalls.length} calls`);
      check("the wait ends after Retry-After", !guard.spotifyResting(Date.now() + 121_000));
      guard.resetSpotifyRestForTests();
    }

    console.log("an artist Spotify does not know");
    const gone = (rosterArtistIds as string[]).filter(Boolean)[3];
    if (gone) {
      artistMissing = true;
      spotifyCalls = [];
      await artist("198.51.100.6", gone);
      const firstCalls = spotifyCalls.length;
      spotifyCalls = [];
      const again = await artist("198.51.100.6", gone);
      check("is asked once, then left alone for an hour", firstCalls === 4 && spotifyCalls.length === 0 && again.status === 404, `${firstCalls} then ${spotifyCalls.length} calls`);
      artistMissing = false;
    }
  } else {
    console.log("(no roster artist or no artist route here: the known-artist checks are skipped)");
  }

  if (albumId && hasAlbums) {
    console.log("an album in the discography");
    mailGuard.useCounterStoreForTests(null);
    spotifyCalls = [];
    const ok = await albums("198.51.100.5", albumId);
    const body = (await ok.json()) as Record<string, unknown>;
    check("is looked up and answered under its id", ok.status === 200 && spotifyCalls.length === 1 && albumId in body, `status ${ok.status}, ${spotifyCalls.length} calls`);
    spotifyCalls = [];
    await albums("198.51.100.5", albumId);
    check("a second request is served from the cache", spotifyCalls.length === 0, `${spotifyCalls.length} calls`);

    const otherAlbums = [...new Set((releases as { spotifyId?: string }[]).map((r) => r.spotifyId).filter((x): x is string => Boolean(x) && x !== albumId))];
    if (otherAlbums.length >= 2) {
      console.log("an album request the limiter refuses");
      mailGuard.useCounterStoreForTests({
        durable: true,
        hit: async () => {
          throw new Error("made-up store failure");
        },
        forget: async () => {},
        peek: async () => 0,
      });
      spotifyCalls = [];
      const refused = await albums("198.51.100.7", `${albumId},${otherAlbums[0]}`);
      const rb = (await refused.json()) as Record<string, unknown>;
      check(
        "still sends the cached cover, uncached, and leaves out only the missing one",
        refused.status === 200 && albumId in rb && !(otherAlbums[0] in rb) && refused.headers.get("cache-control") === "no-store" && spotifyCalls.length === 0,
        `status ${refused.status}, keys ${Object.keys(rb).join(",")}, ${refused.headers.get("cache-control")}, ${spotifyCalls.length} calls`,
      );
      mailGuard.useCounterStoreForTests(null);

      console.log("an album Spotify does not know");
      albumMissing = true;
      spotifyCalls = [];
      await albums("198.51.100.8", otherAlbums[1]);
      const firstCalls = spotifyCalls.length;
      spotifyCalls = [];
      await albums("198.51.100.8", otherAlbums[1]);
      check("is asked once, then left alone for an hour", firstCalls === 1 && spotifyCalls.length === 0, `${firstCalls} then ${spotifyCalls.length} calls`);
      albumMissing = false;
      const mixed = await albums("198.51.100.8", `${albumId},${otherAlbums[1]}`);
      check("an answer lacking only a cover Spotify said does not exist is cached for an hour, not a day", mixed.headers.get("cache-control") === "public, s-maxage=3600", String(mixed.headers.get("cache-control")));
    }
  } else {
    console.log("(no Spotify album or no albums route here: the known-album checks are skipped)");
  }

  // While Spotify refuses the id (403) nothing is cached, so every request reaches it: the case the
  // per-caller limit is for. It needs a second roster artist, as the first is cached above; a site
  // with one artist or none has the limit checked directly below.
  const uncachedArtist = (rosterArtistIds as string[]).filter(Boolean)[1];
  if (uncachedArtist && hasArtist) {
    console.log("one caller asking again and again for an answer that is never cached");
    mailGuard.useCounterStoreForTests(null);
    spotifyFailing = true;
    spotifyCalls = [];
    const statuses: number[] = [];
    for (let i = 0; i < 40; i++) {
      statuses.push((await artist("203.0.113.9", uncachedArtist, { "x-forwarded-for": `192.0.2.${i}` })).status);
    }
    const through = statuses.filter((s) => s !== 429).length;
    check(
      "at most 30 requests an hour reach Spotify, X-Forwarded-For notwithstanding",
      through === 30 && statuses[39] === 429 && spotifyCalls.length === 30 * 4, // four Spotify calls a lookup
      `${through} through, last ${statuses[39]}, ${spotifyCalls.length} Spotify calls`,
    );
    const other = await artist("203.0.113.10", uncachedArtist);
    check("another caller is not stopped by it", other.status !== 429, `status ${other.status}`);
    spotifyFailing = false;
  }

  const SEARCH_ROUTE = "../src/app/api/spotify-artists/route";
  if (existsSync(new URL(`${SEARCH_ROUTE}.ts`, import.meta.url)) && rosterId) {
    console.log("the roster search");
    const searchRoute = await import(SEARCH_ROUTE);
    const search = (ip: string) => searchRoute.GET(from(ip, "https://site.example.invalid/api/spotify-artists")) as Promise<Response>;
    guard.resetSpotifyRestForTests();
    mailGuard.useCounterStoreForTests({
      durable: true,
      hit: async () => {
        throw new Error("made-up store failure");
      },
      forget: async () => {},
      peek: async () => 0,
    });
    spotifyCalls = [];
    const down = await search("198.51.100.20");
    check("a cold cache with a failing store is refused 503 with no search", down.status === 503 && spotifyCalls.length === 0, `status ${down.status}, ${spotifyCalls.length} calls`);
    mailGuard.useCounterStoreForTests(null);
    searchFailing = true;
    const failed = await search("198.51.100.21");
    searchFailing = false;
    guard.resetSpotifyRestForTests();
    check("a search that failed for a moment is sent uncached", failed.status === 200 && failed.headers.get("cache-control") === "no-store", String(failed.headers.get("cache-control")));
    const fine = await search("198.51.100.21");
    spotifyCalls = [];
    const again = await search("198.51.100.21");
    check("a full answer is cached", /s-maxage/.test(fine.headers.get("cache-control") ?? "") && again.status === 200 && spotifyCalls.length === 0, `${spotifyCalls.length} calls`);
  }

  console.log("the per-caller limit");
  mailGuard.useCounterStoreForTests(null);
  const { allowSpotifyCall, SPOTIFY_CALLER_MAX } = await import("../src/lib/spotify-guard");
  const verdicts: boolean[] = [];
  for (let i = 0; i <= SPOTIFY_CALLER_MAX; i++) verdicts.push((await allowSpotifyCall(from("203.0.113.20", "https://site.example.invalid/"))).ok);
  check(`allows ${SPOTIFY_CALLER_MAX} an hour and refuses the next`, verdicts.filter(Boolean).length === SPOTIFY_CALLER_MAX && !verdicts[SPOTIFY_CALLER_MAX]);

  console.log("the cache");
  const { BoundedCache } = await import("../src/lib/spotify-guard");
  const cache = new BoundedCache<number>(3, 1000);
  for (let i = 0; i < 10; i++) cache.set(`k${i}`, i, 0);
  check("holds at most its cap", cache.size === 3, `size ${cache.size}`);
  check("drops the oldest first", cache.get("k0", 1) === undefined && cache.get("k9", 1) === 9);
  const fixed = new BoundedCache<number>(10, 1000);
  fixed.set("a", 1, 0);
  fixed.set("b", 2, 900);
  check("an entry expires a fixed time after it was stored, whatever came later", fixed.get("a", 1001) === undefined && fixed.get("b", 1001) === 2);

  console.log(fails ? `\n${fails} check(s) failed` : "\nall checks passed");
}

main()
  .then(() => process.exit(fails ? 1 : 0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
