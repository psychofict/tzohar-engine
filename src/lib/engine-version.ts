import release from "../../engine.json";

/**
 * Which engine release this checkout is.
 *
 * `engine.json` at the repo root is the single source of truth, because it has to
 * be readable two ways: imported here, and fetched over the GitHub API by Studio
 * when it compares a client repo against the engine (studio/lib/engine-sync.ts).
 * A version baked into a TS constant would be invisible to the second reader.
 *
 * Surfaced in the CRM so the person editing the site can say what they're running
 * when something looks wrong — "engine 2.0.0" is a useful sentence in a support
 * message; "the website" is not.
 */
export const ENGINE_VERSION: string = release.version;
export const ENGINE_NAME: string | undefined = release.name;
export const ENGINE_RELEASED: string | undefined = release.released;
export const ENGINE_HIGHLIGHTS: string[] = release.highlights ?? [];
