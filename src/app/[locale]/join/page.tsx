"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Check, ArrowRight, Star } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Container from "@/components/ui/Container";
import MembershipPanel from "@/components/MembershipPanel";
import LegalConsent from "@/components/LegalConsent";
import { plans, type Plan } from "@/data/plans";
import { useMembership, startCheckout } from "@/lib/membership";
import { useFormSubmit } from "@/lib/useFormSubmit";

const accentRing: Record<Plan["accent"], string> = {
  ocean: "ring-ocean/30",
  sunset: "ring-sunset/40",
  violet: "ring-violet/30",
  magenta: "ring-magenta/30",
};

export default function JoinPage() {
  const t = useTranslations("plans");
  const membership = useMembership();

  // Free tier = email capture (reuses the superfan endpoint).
  const [email, setEmail] = useState("");
  const { loading, success, error, submitForm } = useFormSubmit("/api/superfan");
  const handleFree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await submitForm({ email, source: "join-free" });
  };

  // Paid tiers = hub Stripe checkout (via same-origin proxy).
  const [pending, setPending] = useState<string | null>(null);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);
  const [billing, setBilling] = useState<"month" | "year">("month");
  const onSubscribe = async (plan: Plan) => {
    if (!plan.hubPlan) return;
    setCheckoutErr(null);
    setPending(plan.slug);
    try {
      await startCheckout(plan.hubPlan, billing); // navigates away on success
    } catch (err) {
      setCheckoutErr(err instanceof Error ? err.message : "Checkout failed.");
      setPending(null);
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-bg text-ink">
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        accent="sunset"
      />

      <Container size="lg" className="pt-10">
        <MembershipPanel state={membership} showPlansLink={false} />
        {membership.member && (
          <div className="mt-4 flex justify-end">
            <Link
              href="/vault"
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-ink px-6 text-[15px] font-semibold text-bg hover:bg-ink-2 transition-colors"
            >
              {t("enterVault")} <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </Container>

      <Container size="xl" className="py-10 sm:py-14">
        {/* Billing cadence toggle */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="inline-flex items-center rounded-full border border-line bg-elevated p-1">
            {(["month", "year"] as const).map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBilling(cycle)}
                aria-pressed={billing === cycle}
                className={`h-9 rounded-full px-5 text-sm font-semibold transition-colors ${
                  billing === cycle ? "bg-ink text-bg" : "text-ink-2 hover:text-ink"
                }`}
              >
                {cycle === "month" ? t("billMonthly") : t("billAnnual")}
              </button>
            ))}
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-emerald">{t("annualSave")}</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 items-start">
          {plans.map((plan) => {
            const features = t.raw(`${plan.slug}.features`) as string[];
            const isCurrent = membership.member && membership.plan === plan.hubPlan;
            return (
              <div
                key={plan.slug}
                className={`relative flex flex-col rounded-3xl border bg-elevated p-6 sm:p-7 ${
                  plan.popular ? `border-transparent ring-2 ${accentRing[plan.accent]} shadow-card` : "border-line"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-sunset px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-on-accent">
                    <Star size={12} /> {t("mostPopular")}
                  </span>
                )}

                <h2 className="text-lg font-bold text-ink">{t(`${plan.slug}.name`)}</h2>
                <p className="mt-1 text-sm text-ink-2">{t(`${plan.slug}.tagline`)}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  {plan.paid ? (
                    <>
                      <span className="text-4xl font-bold tracking-tight text-ink">
                        ${billing === "year" ? plan.annualUsd : plan.priceUsd}
                      </span>
                      <span className="text-sm text-ink-3">{billing === "year" ? t("perYear") : t("perMonth")}</span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold tracking-tight text-ink">{t("freePrice")}</span>
                  )}
                </div>
                {plan.annualUsd && (
                  <p className="mt-1 text-xs text-ink-3">
                    {billing === "year" ? t("billedYearly") : t("annual", { price: `$${plan.annualUsd}` })}
                  </p>
                )}

                {/* CTA */}
                <div className="mt-6">
                  {plan.paid ? (
                    isCurrent ? (
                      <a
                        href={membership.manageUrl}
                        className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full border border-line-strong text-[15px] font-semibold text-ink hover:bg-surface transition-colors"
                      >
                        {t("status.currentPlan")}
                      </a>
                    ) : (
                      <button
                        onClick={() => onSubscribe(plan)}
                        disabled={pending === plan.slug}
                        className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-ocean text-[15px] font-semibold text-on-accent hover:bg-ocean-strong transition-colors disabled:opacity-50"
                      >
                        {pending === plan.slug
                          ? t("joining")
                          : membership.signedIn
                            ? t(`${plan.slug}.cta`)
                            : t("signInToJoin")}
                        {pending !== plan.slug && <ArrowRight size={16} />}
                      </button>
                    )
                  ) : success ? (
                    <p className="flex h-12 items-center justify-center rounded-full bg-emerald/12 text-sm font-semibold text-emerald">
                      {t("freeThanks")}
                    </p>
                  ) : (
                    <form onSubmit={handleFree} className="flex flex-col gap-2">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("emailPlaceholder")}
                        aria-label={t("emailPlaceholder")}
                        className="h-12 rounded-full border border-line bg-bg px-5 text-[15px] text-ink placeholder:text-ink-3 focus:border-ocean focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full border border-line-strong text-[15px] font-semibold text-ink hover:bg-surface transition-colors disabled:opacity-50"
                      >
                        {loading ? t("joining") : t("free.cta")}
                      </button>
                      {error && <p className="text-xs text-magenta">{error}</p>}
                      <LegalConsent className="text-[11px] leading-snug text-ink-3" />
                    </form>
                  )}
                </div>

                {/* Features */}
                {plan.inherits && (
                  <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
                    {t("everythingIn", { plan: t(`${plan.inherits}.name`) })}
                  </p>
                )}
                <ul className="mt-3 flex flex-col gap-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[15px] text-ink-2">
                      <Check size={18} className="mt-0.5 shrink-0 text-emerald" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {checkoutErr && (
          <p className="mt-6 text-center text-sm text-magenta">{checkoutErr}</p>
        )}
        <p className="mt-8 text-center text-xs text-ink-3">{t("footnote")}</p>
        <LegalConsent variant="paid" className="mx-auto mt-3 max-w-md text-center text-xs leading-relaxed text-ink-3" />

        {/* FAQ */}
        <div className="mx-auto mt-16 max-w-2xl">
          <h2 className="mb-6 text-center font-bold tracking-tight text-ink text-[clamp(1.5rem,3vw,2.25rem)]">
            {t("faqTitle")}
          </h2>
          <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-elevated">
            {(t.raw("faq") as { q: string; a: string }[]).map((item) => (
              <div key={item.q} className="p-5 sm:p-6">
                <dt className="font-semibold text-ink">{item.q}</dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </main>
  );
}
