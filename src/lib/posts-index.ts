import { site } from "@/config/site";

/** Where the engine serves the post index when a site names no other page for it. */
export const DEFAULT_POSTS_INDEX = "/posts";

/**
 * The post index's path (`site.posts.indexPath`), e.g. "/journal" on a site whose writing lives
 * on a composed Journal page. Post pages stay at /posts/<slug>; only the index moves, and
 * next.config.ts redirects /posts there (308).
 */
export const postsIndexPath: string = site.posts?.indexPath ?? DEFAULT_POSTS_INDEX;

/** True when the index is somewhere other than /posts. */
export const postsIndexMoved: boolean = postsIndexPath !== DEFAULT_POSTS_INDEX;

/**
 * A link aimed at the default index, pointed at the configured one. Any other link is returned
 * unchanged, so a block's "All posts" link written as "/posts" follows the site's choice.
 */
export function postsIndexHref(href: string, indexPath: string = postsIndexPath): string {
  const [path, hash] = href.split("#");
  if (path.replace(/\/+$/, "") !== DEFAULT_POSTS_INDEX) return href;
  return hash ? `${indexPath}#${hash}` : indexPath;
}
