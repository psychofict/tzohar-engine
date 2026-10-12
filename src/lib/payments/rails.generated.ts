/* eslint-disable */
// ──────────────────────────────────────────────────────────────────────────
// GENERATED FILE — DO NOT EDIT.
//
// Edit the source and re-run the sync. A change made here is lost on the next run
// and, worse, is invisible until then: the whole point of one source is that the
// three copies of the checkout cannot disagree about which rails exist.
//
//   source: products/accounts-hub/integration-kit/payments/rails.ts
//   sync:   infra/scripts/sync-payment-ui.py
//   check:  infra/scripts/sync-payment-ui.py --check
//   sha256: 48aeed6fd618d459
// ──────────────────────────────────────────────────────────────────────────

/**
 * What a customer may be shown at checkout, and what the server will accept.
 *
 * Two different facts used to be tangled in one array: the three values the
 * Paynow adapter accepts, and the seven brands its hosted page actually
 * carries. Splitting them is what lets the page show real marks without
 * implying it offers more rails than it does.
 *
 * `RailId` must stay identical to SELECTABLE in src/lib/payments/paynow.ts.
 * A test asserts it, so the user interface cannot drift ahead of the adapter.
 *
 * Nothing here may be widened without evidence. The allow list below is what
 * a live checkout rendered on 2 September 2026, recorded in docs/BILLING.md.
 */

export type RailId = "web" | "ecocash" | "innbucks";

export type MarkId =
  | "visa"
  | "mastercard"
  | "zimswitch"
  | "omari"
  | "ecocash"
  | "innbucks"
  | "paynow";

export type Rail = {
  id: RailId;
  /** The option's accessible name. Keep it a thing, not an instruction. */
  title: string;
  /** Marks shown inside the option. Decoration only: the spoken name is the
   *  title and the enumeration is carried by a sentence, never by the images. */
  marks: MarkId[];
  /** One line under the title. What happens after they press the button. */
  note: string;
  needsPhone: boolean;
};

export const RAILS: readonly Rail[] = [
  {
    id: "web",
    title: "Card, bank or wallet",
    marks: ["visa", "mastercard", "zimswitch", "omari"],
    note: "Also internet and mobile banking. You pick on the Paynow page.",
    needsPhone: false,
  },
  {
    id: "ecocash",
    title: "EcoCash",
    marks: ["ecocash"],
    note: "We send a prompt to your phone.",
    needsPhone: true,
  },
  {
    id: "innbucks",
    title: "InnBucks",
    marks: ["innbucks"],
    note: "We send a payment code to the InnBucks app.",
    needsPhone: true,
  },
];

/**
 * Methods that must never appear, each for a reason that is written down.
 * The test asserts none of these reaches the manifest or the marks folder,
 * because "we did not add it" is not a control and this has to survive a
 * future session that has read none of the history.
 */
export const DENIED: Record<string, string> = {
  onemoney:
    "The merchant account offers OneMoney in Zimbabwe dollars only. The fleet prices and settles in US dollars, so a OneMoney push could never pay for anything. See src/lib/paynow-client.ts.",
  telecash: "Not on the live checkout. Paynow's own marketing strip still carries it; that is not evidence.",
  paygo: "Ticked on the integration, but checkout renders O'mari instead. The integration checkboxes are not the source of truth.",
  paypal: "No integration exists anywhere in the fleet.",
  stripe: "Retired company-wide on 2 September 2026.",
  paystack: "Dormant, never live.",
};

/** The spoken enumeration for one option, so a screen reader hears a sentence
 *  rather than a row of graphics. */
export function acceptsSentence(rail: Rail, names: Record<MarkId, string>): string {
  const listed = rail.marks.map(mark => names[mark]);
  const last = listed.pop();
  const joined = listed.length ? `${listed.join(", ")} and ${last}` : last;
  return rail.id === "web"
    ? `Accepts ${joined}, plus internet and mobile banking.`
    : `Pays with ${joined}.`;
}
