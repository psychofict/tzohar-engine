// CONTENT lives in ./press.json — the git-as-DB artifact Tzohar Studio edits and
// commits (see docs/studio.md). Validated against the shared schema at load, same
// pattern as ./gallery.ts.

import { pressSchema, type PressPhoto, type PressLogo, type PressFact, type PressLink } from "@tzohar/schema";
import { site } from "@/config/site";
import raw from "./press.json";

const content = pressSchema.parse(raw);

export type { PressPhoto, PressLogo, PressFact, PressLink };
export const pressShortBio: string = content.shortBio;
export const pressKeyFacts: PressFact[] = content.keyFacts;
export const pressPhotos: PressPhoto[] = content.photos;
export const pressLogos: PressLogo[] = content.logos;
export const pressStreamingLinks: PressLink[] = content.streamingLinks;
export const pressHeroImage: string | undefined = content.heroImage;
export const pressHeroAlt: string | undefined = content.heroAlt;

/** Wide lockups, falling back to the site's own logo pair. */
export const pressLockupLight: string = content.lockupLight ?? site.brand.logoLight;
export const pressLockupDark: string = content.lockupDark ?? site.brand.logoDark;
