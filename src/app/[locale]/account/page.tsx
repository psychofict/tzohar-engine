"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Star, LogOut, ShieldCheck, ArrowRight, Loader2, LogIn, Sun, Moon, Settings2 } from "lucide-react";
import Container from "@/components/ui/Container";
import { MobileLanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTheme } from "@/components/ThemeProvider";
import { useMembership, hubAccountUrl } from "@/lib/membership";
import { planByHubPlan } from "@/data/plans";
import AccountProfileForm from "@/components/AccountProfileForm";

export default function AccountPage() {
  const t = useTranslations("account");
  const tp = useTranslations("plans");
  const tc = useTranslations("common");
  const m = useMembership();
  const { theme, toggleTheme } = useTheme();

  const tier = planByHubPlan(m.plan);
  const planLabel = tier ? tp(`${tier.slug}.name`) : m.planName ?? m.plan ?? "";
  const initial = (m.name ?? m.email ?? "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <main id="main-content" className="min-h-screen bg-bg text-ink">
      <Container size="md" className="pt-28 sm:pt-32 pb-20">
        <h1 className="font-bold tracking-tight text-[clamp(1.9rem,4vw,2.75rem)]">{t("title")}</h1>
        <p className="mt-2 text-ink-2">{t("subtitle")}</p>

        {m.loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-ink-3" />
          </div>
        ) : !m.signedIn ? (
          <div className="mt-8 rounded-2xl border border-line bg-elevated p-8 text-center">
            <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink-2">
              <LogIn size={22} />
            </span>
            <h2 className="text-xl font-bold">{t("signedOutTitle")}</h2>
            <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink-2">{t("signedOutDesc")}</p>
            <a
              href={m.signInUrl}
              className="mt-6 inline-flex h-11 items-center gap-1.5 rounded-full bg-ocean px-6 text-[15px] font-semibold text-on-accent hover:bg-ocean-strong transition-colors"
            >
              <LogIn size={16} /> {tp("status.signIn")}
            </a>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-5">
            {/* Profile */}
            <div className="flex items-center gap-4 rounded-2xl border border-line bg-elevated p-5">
              {m.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.image} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-xl font-bold text-ink-2">
                  {initial}
                </span>
              )}
              <div className="min-w-0">
                {m.name && <p className="truncate text-lg font-bold text-ink">{m.name}</p>}
                <p className="truncate text-[15px] text-ink-2">{m.email}</p>
              </div>
            </div>

            {/* Editable account profile (display name + notifications) */}
            <AccountProfileForm fallbackName={m.name} />

            {/* Membership */}
            <section className="rounded-2xl border border-line bg-elevated p-6">
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3">{t("membership")}</h2>
              {m.member ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sunset/15 text-sunset">
                      <Star size={18} />
                    </span>
                    <p className="font-bold text-ink">{tp("status.memberTitle", { plan: planLabel })}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/vault"
                      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-semibold text-bg hover:bg-ink-2 transition-colors"
                    >
                      {tp("enterVault")} <ArrowRight size={15} />
                    </Link>
                    <a
                      href={m.manageUrl}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong px-5 text-sm font-semibold text-ink hover:bg-surface transition-colors"
                    >
                      <Settings2 size={15} /> {t("manageBilling")}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{t("freeTitle")}</p>
                    <p className="mt-1 text-[15px] text-ink-2">{t("freeDesc")}</p>
                  </div>
                  <Link
                    href="/join"
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ocean px-5 text-sm font-semibold text-on-accent hover:bg-ocean-strong transition-colors"
                  >
                    {tp("status.seePlans")} <ArrowRight size={15} />
                  </Link>
                </div>
              )}
            </section>

            {/* Preferences */}
            <section className="rounded-2xl border border-line bg-elevated p-6">
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3">{t("preferences")}</h2>
              <div className="flex flex-col gap-5">
                <div>
                  <p className="mb-2.5 text-sm font-semibold text-ink">{t("language")}</p>
                  <MobileLanguageSwitcher />
                </div>
                <div>
                  <p className="mb-2.5 text-sm font-semibold text-ink">{t("appearance")}</p>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-2 transition-colors"
                  >
                    {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                    {theme === "dark" ? tc("switchToLight") : tc("switchToDark")}
                  </button>
                </div>
              </div>
            </section>

            {/* Account & security (hub) */}
            <section className="rounded-2xl border border-line bg-elevated p-6">
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3">{t("security")}</h2>
              <p className="text-[15px] leading-relaxed text-ink-2">{t("securityDesc")}</p>
              <a
                href={hubAccountUrl()}
                className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong px-5 text-sm font-semibold text-ink hover:bg-surface transition-colors"
              >
                <ShieldCheck size={15} /> {t("manageAccount")}
              </a>
            </section>

            {/* Sign out */}
            <div>
              <a
                href={m.logoutUrl}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-6 text-[15px] font-semibold text-ink-2 hover:text-ink hover:bg-surface transition-colors"
              >
                <LogOut size={16} /> {t("signOut")}
              </a>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
