import { site } from "@/config/site";

/**
 * The site's streaming/listening platforms, derived from `site.socials`.
 *
 * The music page hard-coded four `<a>` tags with the reference build's Spotify,
 * Apple Music, SoundCloud and YouTube URLs — the same four links the config
 * already carried, so a client filling in their own socials still shipped a
 * "Listen everywhere" row pointing at somebody else's catalogue.
 *
 * Brand colours belong to the platform, not to the site, so they stay here.
 * A platform with no colour renders as an outline pill.
 */
const BRAND: Record<string, string> = {
  spotify: "#1DB954",
  apple: "#FA243C",
};

/** Icon keys treated as places you can listen, in the order they should appear. */
const STREAMING = ["spotify", "apple", "soundcloud", "youtube", "bandcamp", "tidal", "deezer"];

export interface StreamingPlatform {
  name: string;
  url: string;
  icon: string;
  color?: string;
}

export const streamingPlatforms: StreamingPlatform[] = STREAMING.flatMap((icon) => {
  const found = site.socials.filter((s) => s.icon === icon);
  return found.map((s) => ({ name: s.name, url: s.url, icon: s.icon, color: BRAND[icon] }));
});
