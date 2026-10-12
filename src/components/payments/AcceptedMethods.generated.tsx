/* eslint-disable */
// ──────────────────────────────────────────────────────────────────────────
// GENERATED FILE — DO NOT EDIT.
//
// Edit the source and re-run the sync. A change made here is lost on the next run
// and, worse, is invisible until then: the whole point of one source is that the
// three copies of the checkout cannot disagree about which rails exist.
//
//   source: products/accounts-hub/integration-kit/payments/AcceptedMethods.tsx
//   sync:   infra/scripts/sync-payment-ui.py
//   check:  infra/scripts/sync-payment-ui.py --check
//   sha256: 1deb2148236fa0d3
// ──────────────────────────────────────────────────────────────────────────

import type { ReactNode } from "react";
import PaymentMark from "./PaymentMark.generated";
import { DEFAULT_MARKS, MARKS, MARK_NAMES } from "../../lib/payments/marks.generated";
import type { MarkId } from "../../lib/payments/rails.generated";
import s from "./payments.generated.module.css";

/**
 * What we can take, shown where somebody is deciding whether to buy.
 *
 * No hooks, so it renders in a server component. It takes plain strings rather
 * than a translation function, because five of the consuming repositories have
 * no internationalisation and the two that do can pass their own. Brand names
 * are never translated: a trademark is the same proper noun in every locale.
 * Only the caption and the generic words are.
 *
 * A method absent from the manifest is dropped rather than rendered, so a props
 * mistake in one repository can never advertise a rail checkout cannot honour.
 */
export default function AcceptedMethods({
  marks = DEFAULT_MARKS,
  caption,
  acceptsLabel,
  showPaynow = true,
  align = "start",
  className,
}: {
  marks?: MarkId[];
  /** A node, so a consumer can put a link in the line without a second slot. */
  caption?: ReactNode;
  /** Spoken sentence. "{list}" is replaced with the brand names. */
  acceptsLabel?: string;
  showPaynow?: boolean;
  align?: "start" | "center";
  className?: string;
}) {
  const shown = marks.filter(mark => {
    if (MARKS[mark]) return true;
    if (process.env.NODE_ENV !== "production") console.error(`AcceptedMethods: no mark named "${mark}"`);
    return false;
  });
  if (!shown.length) return null;

  const names = shown.map(mark => MARK_NAMES[mark]);
  const last = names.pop();
  const list = names.length ? `${names.join(", ")} and ${last}` : last;
  const spoken = (acceptsLabel ?? "We accept {list}.").replace("{list}", list ?? "");

  return (
    <div className={className ? `${s.strip} ${className}` : s.strip} data-align={align}>
      <ul className={s.stripList} aria-hidden="true">
        {shown.map(mark => <li key={mark}><PaymentMark id={mark} size="strip" /></li>)}
        {showPaynow && <li className={s.gateway}><PaymentMark id="paynow" size="strip" /></li>}
      </ul>
      <span className={s.srOnly}>{spoken}</span>
      {caption && <p className={s.caption}>{caption}</p>}
    </div>
  );
}
