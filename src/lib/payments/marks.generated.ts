/* eslint-disable */
// ──────────────────────────────────────────────────────────────────────────
// GENERATED FILE — DO NOT EDIT.
//
// Edit the source and re-run the sync. A change made here is lost on the next run
// and, worse, is invisible until then: the whole point of one source is that the
// three copies of the checkout cannot disagree about which rails exist.
//
//   source: products/accounts-hub/integration-kit/payments/marks.ts
//   sync:   infra/scripts/sync-payment-ui.py
//   check:  infra/scripts/sync-payment-ui.py --check
//   sha256: 04a34e1689a2fd6c
// ──────────────────────────────────────────────────────────────────────────

import type { MarkId } from "./rails.generated";

/**
 * One row per payment mark. Sizes are the artwork's own, measured on
 * 17 September 2026, not guessed.
 *
 * `scale` is optical, not geometric. A circular device and a wide wordmark set
 * to the same box height do not read as the same size, so each mark gets a
 * nudge and the row looks level. This is the same problem the website solves
 * per-logo in PlatformLogo.module.css.
 *
 * Every mark renders on a white chip in both themes. That is deliberate and it
 * is the only approach that works here: the repositories consuming this kit run
 * four different theme conventions, two of them dark by default and one with no
 * dark mode at all, so a light/dark artwork pair keyed off a selector cannot be
 * written once and be right everywhere. A white ground is the same value in
 * both themes. Measured on 17 September: on a dark ground Mastercard's wordmark
 * and O'mari's endorsement line disappear, and on a white ground the InnBucks
 * reversed lockup disappears. On a white chip all seven read.
 */
export type Mark = {
  /** Under /payments/ in each consuming repo's public tree. */
  file: string;
  /** The brand's own name for itself. Never translated. */
  name: string;
  /** Intrinsic pixels, so width and height attributes are always correct. */
  w: number;
  h: number;
  /** Optical nudge on the rendered height. 1 leaves it alone. */
  scale?: number;
};

export const MARKS: Record<MarkId, Mark> = {
  visa: { file: "visa.svg", name: "Visa", w: 1000, h: 325, scale: 0.86 },
  mastercard: { file: "mastercard.svg", name: "Mastercard", w: 999, h: 776, scale: 1 },
  zimswitch: { file: "zimswitch.svg", name: "ZimSwitch", w: 117, h: 58, scale: 1 },
  omari: { file: "omari.png", name: "O'mari", w: 281, h: 117, scale: 0.92 },
  ecocash: { file: "ecocash.png", name: "EcoCash", w: 225, h: 76, scale: 0.84 },
  innbucks: { file: "innbucks.png", name: "InnBucks", w: 165, h: 164, scale: 1 },
  paynow: { file: "paynow.png", name: "Paynow", w: 200, h: 200, scale: 0.94 },
};

/** Names keyed for the spoken sentence, so no caller retypes a brand. */
export const MARK_NAMES = Object.fromEntries(
  Object.entries(MARKS).map(([id, mark]) => [id, mark.name]),
) as Record<MarkId, string>;

/** What the accepted-methods strip shows when a caller says nothing. Paynow is
 *  appended separately, because it is the gateway rather than a method. */
export const DEFAULT_MARKS: MarkId[] = [
  "visa",
  "mastercard",
  "zimswitch",
  "ecocash",
  "innbucks",
  "omari",
];
