"use client";

import { site } from "@/config/site";
import HeroPhoto from "./HeroPhoto";
import HeroSplit from "./HeroSplit";
import HeroType from "./HeroType";
import HeroPortrait from "./HeroPortrait";
import type { HeroProps } from "./heroShared";

const HEROES = {
  photo: HeroPhoto,
  split: HeroSplit,
  type: HeroType,
  portrait: HeroPortrait,
} as const;

/** Renders the home hero variant selected in `site.layout.hero` (default "photo").
 *  When `site.layout.heroTone` is "dark", the whole hero renders inside a
 *  `.section-invert` scope — a dark hero band on an otherwise light page. */
export default function HomeHero(props: HeroProps) {
  const Hero = HEROES[site.layout?.hero ?? "photo"] ?? HeroPhoto;
  if (site.layout?.heroTone === "dark") {
    return (
      <div className="section-invert">
        <Hero {...props} />
      </div>
    );
  }
  return <Hero {...props} />;
}
