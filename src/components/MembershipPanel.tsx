"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LogIn, Star, Settings2, UserRound } from "lucide-react";
import type { MembershipState } from "@/lib/membership";
import { planByHubPlan } from "@/data/plans";

// Presentational membership status + actions. The parent calls useMembership()
// once and passes the state in (so a page never double-fetches the hub).
export default function MembershipPanel({
  state,
  showPlansLink = true,
}: {
  state: MembershipState;
  showPlansLink?: boolean;
}) {
  const t = useTranslations("plans");
  const { loading, signedIn, member, plan, planName, name, signInUrl, manageUrl } = state;
  // Localized tier name resolved from the hub Plan enum (e.g. "STARTER" → "Insider").
  const tier = planByHubPlan(plan);
  const tierLabel = tier ? t(`${tier.slug}.name`) : planName ?? plan ?? "";

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-elevated p-4 text-ink-3">
        <span className="h-9 w-9 animate-pulse rounded-full bg-surface-2" />
        <span className="text-sm">{t("status.checking")}</span>
      </div>
    );
  }

  // Member — active paid subscription.
  if (member) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-elevated p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sunset/15 text-sunset">
            <Star size={20} />
          </span>
          <div>
            <p className="font-bold text-ink">{t("status.memberTitle", { plan: tierLabel })}</p>
            <p className="text-sm text-ink-2">{t("status.memberDesc")}</p>
          </div>
        </div>
        <a
          href={manageUrl}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong px-5 text-sm font-semibold text-ink hover:bg-surface transition-colors"
        >
          <Settings2 size={15} /> {t("status.manage")}
        </a>
      </div>
    );
  }

  // Signed in, no active subscription → upgrade.
  if (signedIn) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-elevated p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink-2">
            <UserRound size={20} />
          </span>
          <div>
            <p className="font-bold text-ink">{t("status.freeTitle", { name: name ?? "" })}</p>
            <p className="text-sm text-ink-2">{t("status.freeDesc")}</p>
          </div>
        </div>
        {showPlansLink && (
          <Link
            href="/join"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ocean px-5 text-sm font-semibold text-on-accent hover:bg-ocean-strong transition-colors"
          >
            {t("status.upgrade")}
          </Link>
        )}
      </div>
    );
  }

  // Signed out.
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-elevated p-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink-2">
          <LogIn size={20} />
        </span>
        <div>
          <p className="font-bold text-ink">{t("status.signedOutTitle")}</p>
          <p className="text-sm text-ink-2">{t("status.signedOutDesc")}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={signInUrl}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-semibold text-bg hover:bg-ink-2 transition-colors"
        >
          <LogIn size={15} /> {t("status.signIn")}
        </a>
        {showPlansLink && (
          <Link
            href="/join"
            className="inline-flex h-10 items-center rounded-full border border-line-strong px-5 text-sm font-semibold text-ink hover:bg-surface transition-colors"
          >
            {t("status.seePlans")}
          </Link>
        )}
      </div>
    </div>
  );
}
