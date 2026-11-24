import { site } from "@/config/site";

/**
 * Where the site's hero picture is cropped, from `brand.heroFocal` (percent across, percent down),
 * as a CSS object-position. Undefined when the config names no point.
 */
export const heroFocalPosition: string | undefined = site.brand.heroFocal
  ? `${site.brand.heroFocal.x}% ${site.brand.heroFocal.y}%`
  : undefined;

/**
 * The crop the About and Contact heroes use: the configured point, else the middle of the frame.
 * Both pages used a fixed "74% 16%", tuned for the reference build's one portrait, which cut
 * every other site's picture at the same place whatever was in it.
 */
export const pageHeroPosition: string = heroFocalPosition ?? "center";
