/**
 * Derived views over the Instagram feed.
 *
 * This file used to BE the feed: 404 lines of engine code holding one person's
 * posts, their like counts and their captions, so every client running `music`
 * or `influencer` carried them. The posts are content now
 * (`influencer.json` → `./influencer.ts`); what is left here is the selecting,
 * which is genuinely engine work.
 *
 * It stays a separate module because `music/page.tsx` wants `musicPosts` without
 * caring that the influencer module exists.
 */
import { instagramPosts, type InstagramPost } from "./influencer";

export type { InstagramPost };
export { instagramPosts };

/** Travel & sponsored content posts */
export const travelPosts = instagramPosts
  .filter((p) => p.tags.includes("travel"))
  .sort((a, b) => b.comments - a.comments);

/** Music-related posts */
export const musicPosts = instagramPosts
  .filter((p) => p.tags.includes("music"))
  .sort((a, b) => b.likes - a.likes);

/** Culture & lifestyle posts */
export const culturePosts = instagramPosts
  .filter((p) => p.tags.includes("culture"))
  .sort((a, b) => b.likes - a.likes);

/** All unique locations */
export const locationsVisited = instagramPosts
  .map((p) => p.location)
  .filter((l): l is string => l !== null);

/** Aggregate engagement */
export const totalEngagement = instagramPosts.reduce(
  (acc, p) => ({ likes: acc.likes + p.likes, comments: acc.comments + p.comments }),
  { likes: 0, comments: 0 },
);

/** Embed URL helper */
export function getEmbedUrl(shortcode: string): string {
  return `https://www.instagram.com/p/${shortcode}/embed/`;
}
