/* eslint-disable */
// ──────────────────────────────────────────────────────────────────────────
// GENERATED FILE — DO NOT EDIT.
//
// Edit the source and re-run the sync. A change made here is lost on the next run
// and, worse, is invisible until then: the whole point of one source is that the
// three copies of the checkout cannot disagree about which rails exist.
//
//   source: products/accounts-hub/integration-kit/payments/zw-phone.ts
//   sync:   infra/scripts/sync-payment-ui.py
//   check:  infra/scripts/sync-payment-ui.py --check
//   sha256: a4f2fba48c276c59
// ──────────────────────────────────────────────────────────────────────────

/**
 * Zimbabwean mobile number, normalised to the local 07XXXXXXXX form Paynow's
 * express rails expect.
 *
 * Lifted verbatim out of src/lib/paynow-client.ts on 17 September 2026 so the
 * browser can run it. That module's first import is node:crypto, so a client
 * component could not reach the rule and the page had no way to reject a bad
 * number before a round trip. paynow-client re-exports this, and its existing
 * test is unchanged, which is the proof the move was faithful.
 */
export function normaliseZwPhone(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("263")) local = "0" + local.slice(3);
  else if (local.length === 9 && local.startsWith("7")) local = "0" + local;
  return /^07\d{8}$/.test(local) ? local : null;
}
