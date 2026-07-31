import { site } from "@/config/site";
import { getBlurDataURL } from "@/lib/image-blur";

/** One headline stat shown in the hero (value is content, label a message key). */
export type HeroStat = { value: string; labelKey: string };

export interface HeroProps {
  stats: readonly HeroStat[];
}

/** The art-directed hero image; every site has ogImage as a floor. */
export const heroImageSrc = site.brand.heroImage ?? site.brand.ogImage;

/** Blur placeholder for the hero image, if `npm run generate-blur` has covered it. */
export const heroImageBlur = getBlurDataURL(heroImageSrc);

/** Config-driven focal point → CSS object-position (undefined = per-hero default). */
export const heroFocalPosition = site.brand.heroFocal
  ? `${site.brand.heroFocal.x}% ${site.brand.heroFocal.y}%`
  : undefined;

/** Korean display name next to the latin brand name, from config (not hardcoded). */
export function hangulAlternate(locale: string): string | undefined {
  if (locale !== "ko") return undefined;
  return site.alternateNames?.find((n) => /[가-힣]/.test(n));
}
