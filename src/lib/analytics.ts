/**
 * The analytics a site loads, decided in one place (EBE-7044, decision EBE-7056).
 *
 * src/components/Analytics.tsx loads exactly these tools and the privacy notice
 * (src/app/[locale]/privacy/page.tsx) names exactly these, so the notice can never list a
 * tool the site does not run or leave out one it does. Vercel Web Analytics runs on every
 * site; Google Analytics, Plausible and Naver Analytics only when the site sets
 * NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_PLAUSIBLE_DOMAIN or NEXT_PUBLIC_NAVER_ANALYTICS_ID.
 *
 * This is the only file that reads those three settings, and only Analytics.tsx loads an
 * analytics script: scripts/check-analytics-notice.mjs fails the build otherwise.
 */

export interface AnalyticsSettings {
  gaId?: string;
  plausibleDomain?: string;
  naverId?: string;
}

export type AnalyticsTool =
  | { id: "vercel"; name: "Vercel Web Analytics"; company: "Vercel" }
  | { id: "google"; name: "Google Analytics"; company: "Google"; gaId: string }
  | { id: "plausible"; name: "Plausible"; company: "Plausible"; domain: string }
  | { id: "naver"; name: "Naver Analytics"; company: "Naver"; naverId: string };

/** The site's own settings, read at build time (each name written out so Next inlines it). */
export function siteAnalyticsSettings(): AnalyticsSettings {
  return {
    gaId: process.env.NEXT_PUBLIC_GA_ID,
    plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    naverId: process.env.NEXT_PUBLIC_NAVER_ANALYTICS_ID,
  };
}

/** The tools a site with these settings loads, in the order the notice names them. */
export function analyticsTools(settings: AnalyticsSettings = siteAnalyticsSettings()): AnalyticsTool[] {
  const gaId = settings.gaId?.trim() ?? "";
  const domain = settings.plausibleDomain?.trim() ?? "";
  const naverId = settings.naverId?.trim() ?? "";
  const tools: AnalyticsTool[] = [{ id: "vercel", name: "Vercel Web Analytics", company: "Vercel" }];
  if (gaId) tools.push({ id: "google", name: "Google Analytics", company: "Google", gaId });
  if (domain) tools.push({ id: "plausible", name: "Plausible", company: "Plausible", domain });
  if (naverId) tools.push({ id: "naver", name: "Naver Analytics", company: "Naver", naverId });
  return tools;
}

/** "A", "A and B", "A, B and C". */
export function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
