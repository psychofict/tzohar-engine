// CONTENT lives in ./influencer.json — the git-as-DB artifact Tzohar Studio edits
// and commits (see docs/studio.md). Validated against the shared schema at load,
// same pattern as ./gallery.ts.

import { influencerSchema, type InstagramPost } from "@tzohar/schema";
import raw from "./influencer.json";

const content = influencerSchema.parse(raw);

export type { InstagramPost };
export const instagramHandle: string = content.instagramHandle;
export const influencerHeroImage: string | undefined = content.heroImage;
export const influencerHeroAlt: string | undefined = content.heroAlt;
export const influencerHeroTags: string[] = content.heroTags;
export const orgLogos: Record<string, string> = content.orgLogos;
export const instagramPosts: InstagramPost[] = content.posts;
