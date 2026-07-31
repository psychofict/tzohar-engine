"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { site } from "@/config/site";
import Container from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { hangulAlternate, type HeroProps } from "./heroShared";

/**
 * "type" hero — no photograph: the name IS the image. Viewport-scale display
 * type over token-driven accent glows (they recolor with the site's accent),
 * tagline and stats ruled beneath. For sites whose identity is the wordmark.
 */
export default function HeroType({ stats }: HeroProps) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale();
  const koName = hangulAlternate(locale);

  return (
    <section className="relative overflow-hidden bg-bg min-h-[92svh] flex flex-col justify-center border-b border-line">
      {/* accent atmosphere — pure tokens, so the theme recolors it */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full opacity-[0.13] dark:opacity-[0.2] blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-ocean), transparent 65%)" }}
        />
        <div
          className="absolute -bottom-[25%] -right-[12%] w-[55vw] h-[55vw] rounded-full opacity-[0.10] dark:opacity-[0.16] blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-sunset), transparent 65%)" }}
        />
      </div>

      <Container size="xl" className="relative z-10 pt-28 pb-16">
        <p className="hero-rise hero-rise-1 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-ink-3">
          {t("location")}
        </p>

        <h1 className="hero-rise hero-rise-2 mt-4 type-display text-ink leading-[0.94] text-[calc(clamp(4rem,15vw,12rem)*var(--display-scale))] break-words">
          {site.name}
          {koName && <span className="ml-[0.15em] align-top text-[0.32em] text-ink-3">{koName}</span>}
        </h1>

        <div className="mt-8 lg:mt-12 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-xl">
            <p className="hero-rise hero-rise-3 text-xl sm:text-2xl text-ink-2 leading-relaxed text-pretty">
              {t("heroTagline")}
            </p>
            <p className="hero-rise hero-rise-3 mt-3 text-sm text-ink-3">{t("heroCredibility")}</p>

            <div className="hero-rise hero-rise-4 mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#roles" size="lg" variant="primary">
                {tc("exploreMyWork")}
                <ArrowRight size={18} />
              </ButtonLink>
              <Link
                href={`/${locale}/contact#booking`}
                className="inline-flex h-12 items-center gap-2 rounded-pill border border-line-strong px-6 text-[15px] font-semibold text-ink hover:bg-surface transition-colors"
              >
                {tc("getInTouch")}
              </Link>
            </div>
          </div>

          <dl className="hero-rise hero-rise-5 flex gap-8 sm:gap-10 lg:flex-col lg:gap-5 lg:text-right lg:border-r-0 lg:pl-10">
            {stats.map((stat) => (
              <div key={stat.labelKey}>
                <dt className="sr-only">{t(stat.labelKey)}</dt>
                <dd className="type-display text-3xl sm:text-4xl text-ink leading-none">{stat.value}</dd>
                <p className="mt-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3 leading-tight">
                  {t(stat.labelKey)}
                </p>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
