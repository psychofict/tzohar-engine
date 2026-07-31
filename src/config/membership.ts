/**
 * Membership provider — how this build handles visitor accounts and paid tiers.
 *
 *  - "hub"    : accounts and billing on an Ebenworks SSO hub. No secrets here.
 *  - "stripe" : your own Stripe account. Accounts and billing are yours and you
 *               pay only Stripe's fee — no platform cut. See docs/membership.md
 *               in the full documentation.
 *  - "none"   : no membership. The `membership` and `vault` modules stay off.
 *
 * This file is CLIENT-owned: it is yours to edit, and an engine upgrade will
 * never overwrite it.
 */
export type MembershipProvider = "hub" | "stripe" | "none";

export interface MembershipConfig {
  provider: MembershipProvider;
  /** provider="hub": your accounts-hub product key. */
  hubProduct?: string;
}

export const membership: MembershipConfig = {
  provider: "none",
};
