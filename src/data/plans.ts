// Membership tiers. Copy (names, taglines, feature bullets) is translated in
// messages under the `plans` namespace, keyed by slug. Prices live here.
//
// `hubPlan` maps each paid tier to the accounts-hub `Plan` enum
// (FREE/STARTER/PREMIUM/PRO/TEAM/BUSINESS/…). Checkout sends `hubPlan` to the
// hub, and the hub's session-info returns the active `plan` as that enum value —
// so `planByHubPlan()` resolves it back to the tier for display.
//
// Real prices are configured ON THE HUB (PriceTable rows for (<hubProduct>, <hubPlan>, USD)) and
// resolved server-side at checkout — there is no catalog to sync. Prices here drive
// the marketing card display only.

export type PlanSlug = "free" | "insider" | "studio" | "patron";

export interface Plan {
  slug: PlanSlug;
  paid: boolean;
  /** accounts-hub Plan enum value (paid tiers only). */
  hubPlan?: string;
  priceUsd: number; // monthly; 0 for free
  annualUsd?: number; // optional annual price (≈ 2 months free)
  popular?: boolean;
  accent: "ocean" | "sunset" | "violet" | "magenta";
  /** Which tier this one builds on (for the "Everything in X, plus:" line). */
  inherits?: PlanSlug;
}

export const plans: Plan[] = [
  { slug: "free", paid: false, priceUsd: 0, accent: "ocean" },
  { slug: "insider", paid: true, hubPlan: "STARTER", priceUsd: 6, annualUsd: 50, popular: true, accent: "sunset", inherits: "free" },
  { slug: "studio", paid: true, hubPlan: "PRO", priceUsd: 18, annualUsd: 180, accent: "violet", inherits: "insider" },
  { slug: "patron", paid: true, hubPlan: "BUSINESS", priceUsd: 75, annualUsd: 750, accent: "magenta", inherits: "studio" },
];

export const planBySlug = (slug: string): Plan | undefined => plans.find((p) => p.slug === slug);
export const planByHubPlan = (hubPlan: string | null): Plan | undefined =>
  hubPlan ? plans.find((p) => p.hubPlan === hubPlan) : undefined;
