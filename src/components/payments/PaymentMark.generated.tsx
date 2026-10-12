/* eslint-disable */
// ──────────────────────────────────────────────────────────────────────────
// GENERATED FILE — DO NOT EDIT.
//
// Edit the source and re-run the sync. A change made here is lost on the next run
// and, worse, is invisible until then: the whole point of one source is that the
// three copies of the checkout cannot disagree about which rails exist.
//
//   source: products/accounts-hub/integration-kit/payments/PaymentMark.tsx
//   sync:   infra/scripts/sync-payment-ui.py
//   check:  infra/scripts/sync-payment-ui.py --check
//   sha256: 9e89ecef6e57de2f
// ──────────────────────────────────────────────────────────────────────────

import { MARKS } from "../../lib/payments/marks.generated";
import type { MarkId } from "../../lib/payments/rails.generated";
import s from "./payments.generated.module.css";

/**
 * One payment mark on a white chip.
 *
 * The chip is the whole trick. Eight repositories will consume this and they run
 * four different theme conventions, so a light/dark artwork pair keyed off a
 * selector cannot be right everywhere. White is the same value in both themes,
 * every scheme's artwork is drawn for a light ground, and nothing is inverted,
 * recoloured or redrawn.
 *
 * Decorative by construction: `alt` is empty and the containing row is hidden
 * from assistive technology. The brands are spoken once, as a sentence, by the
 * option that holds them. Four marks inside one radio must be heard as one
 * choice, not four.
 */
export default function PaymentMark({ id, size = "chooser" }: { id: MarkId; size?: "chooser" | "strip" }) {
  const mark = MARKS[id];
  if (!mark) return null;
  const box = size === "chooser" ? 24 : 18;
  const height = Math.round(box * (mark.scale ?? 1));
  const width = Math.round(height * (mark.w / mark.h));
  return (
    <span className={s.chip} data-size={size}>
      {/* A plain img on purpose. This component is synced to eight repositories,
          the marks are 18 to 24 pixels tall and already right-sized on disk, and
          two consumers are not on a framework that optimises images. Routing a
          2 kB mark through an optimiser costs a request and buys nothing. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/payments/${mark.file}`}
        alt=""
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        style={{ height, width }}
      />
    </span>
  );
}
