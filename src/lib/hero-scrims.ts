/**
 * HERO SCRIMS — the legibility washes painted over a section's background photo.
 *
 * One module because these numbers have now been wrong twice, in two different
 * components, for the same underlying reason: a scrim is not a style choice, it is
 * a contrast budget, and the budget is different for each of (light|dark) ×
 * (wide|narrow). Composed-page heroes (`blocks/BlockRenderer`) and core-route
 * heroes (`ui/PageHero`) both need all four, so they share them here rather than
 * each carrying a copy that drifts.
 *
 * The asymmetry worth remembering: **a light wash needs to be much stronger than
 * the dark one, but not so strong that the photograph stops being a photograph.**
 * Darkening a photo moves it AWAY from white type. Lightening one moves it TOWARD
 * the middle values dark ink occupies, so it competes instead of receding. Mirror
 * the dark ramp's opacities and you get grey mush; overcorrect and you get a
 * white rectangle with a rumour of an image behind it. Both have shipped here.
 *
 * Every light value is built from `--color-bg` rather than a literal white, so it
 * tracks the site's paper tone (a warm #F7F6F4 on the reference build, not #FFF).
 * The dark values use a fixed near-black: they sit UNDER light type in a band that
 * is dark in both themes, so they must not follow the theme.
 */

const SCRIM_INK = "#06070B";

/** Near-black at `pct` opacity, optionally with a gradient stop. */
export const ink = (pct: number, stop?: string) =>
  `color-mix(in oklab, ${SCRIM_INK} ${pct}%, transparent)${stop ? ` ${stop}` : ""}`;

/** The site's paper at `pct` opacity, optionally with a gradient stop. */
export const paper = (pct: number, stop?: string) =>
  `color-mix(in oklab, var(--color-bg) ${pct}%, transparent)${stop ? ` ${stop}` : ""}`;

/**
 * A short band under the navbar, added independently of the main ramp so the nav
 * stays legible without darkening the upper third of every photograph.
 */
export const DARK_TOP_BAND = `linear-gradient(180deg, ${ink(58)}, ${ink(0, "180px")})`;
export const LIGHT_TOP_BAND = `linear-gradient(180deg, ${paper(66)}, ${paper(0, "180px")})`;

/**
 * Wide dark wedge. Deliberately steep and long: an earlier ramp fell to 58% by
 * the halfway mark, which cannot carry white display type over a lit face — on
 * the reference build's portrait hero the headline ran across the subject's eyes
 * at roughly 2:1. Copy columns cap near 46% of the band, so this holds ~80%
 * across the whole text column and only opens past it.
 */
export const DARK_WEDGE = [
  `linear-gradient(90deg, ${ink(93)}, ${ink(84, "34%")}, ${ink(52, "62%")}, ${ink(16, "88%")})`,
  `linear-gradient(0deg, ${ink(70)}, ${ink(0, "55%")})`,
  DARK_TOP_BAND,
].join(", ");

/**
 * Narrow dark scrim. A horizontal wedge is meaningless at 390px, where the copy
 * column *is* the full width — there is no other side of the frame to leave open,
 * so a left-weighted ramp just leaves type on whatever the photo happened to
 * show. Below `sm` the ramp runs vertically: heavy under the copy, clearing
 * toward the top so the subject still reads.
 */
export const DARK_MOBILE = [
  `linear-gradient(0deg, ${ink(90)}, ${ink(74, "42%")}, ${ink(58)})`,
  DARK_TOP_BAND,
].join(", ");

/** Evenly darkened, for a photo too busy to hold type against any one region. */
export const DARK_VEIL = [`linear-gradient(0deg, ${ink(74)}, ${ink(58)})`, DARK_TOP_BAND].join(", ");
/** Gentle bottom-up lift, for a photo that is already quiet. */
export const DARK_SOFT = [`linear-gradient(0deg, ${ink(66)}, ${ink(14)})`, DARK_TOP_BAND].join(", ");

/**
 * Wide light wedge — the mirror of `DARK_WEDGE`. The left of the frame goes to
 * near-paper so ink type reads against it, and the wash clears past the copy
 * column so the right of the photograph is still a photograph.
 */
export const LIGHT_WEDGE = [
  `linear-gradient(90deg, ${paper(91)}, ${paper(83, "34%")}, ${paper(44, "64%")}, ${paper(8, "88%")})`,
  `linear-gradient(0deg, ${paper(58)}, ${paper(0, "52%")})`,
  LIGHT_TOP_BAND,
].join(", ");

/**
 * Narrow light scrim — the hardest of the four, and the one that has been wrong
 * in both directions.
 *
 *   93/80/62  too weak. The top of the frame sat at the same value as the ink and
 *             every hero on the reference build had a face under its title.
 *   97/93/86/76  too strong. Legible, but the photograph was gone — the client's
 *             note was "light theme is a little too white washed", and they were
 *             right: at 97% paper over a warm ground it is simply the ground.
 *
 * These values are the tested middle: the flags/faces behind the copy read as
 * colour and place, while dark ink keeps a comfortable margin. Tuned against the
 * live build at ~390–500px rather than derived, because the only thing that
 * settles it is looking at the actual photograph under the actual type.
 *
 * It stays stronger than `LIGHT_WEDGE` for a structural reason, not a stylistic
 * one: there is no open side of the frame to escape to, so the wash is the whole
 * contrast budget.
 */
/*
 * The top band is short and light on purpose. At 72% over 190px it was doing the
 * navbar's job and also erasing the subject: on a narrow frame the head lands
 * around 120–180px down, which is exactly inside that band, so a hero cropped to
 * show a face showed a rumour of one. 58% over 120px keeps dark ink legible over
 * a *bright* plate — which is the only kind this scrim is used on — and lets the
 * top third of the photograph actually read.
 */
export const LIGHT_MOBILE = [
  `linear-gradient(0deg, ${paper(92)}, ${paper(85, "38%")}, ${paper(74, "68%")}, ${paper(56)})`,
  `linear-gradient(180deg, ${paper(58)}, ${paper(0, "120px")})`,
].join(", ");

/** Single-gradient light wash used by the `light` overlay option on a band. */
export const LIGHT_BAND = `linear-gradient(90deg, ${paper(93)}, ${paper(70, "42%")}, ${paper(18, "78%")}, transparent)`;
