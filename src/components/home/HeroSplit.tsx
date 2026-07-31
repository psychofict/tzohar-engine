"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { site } from "@/config/site";
import { ButtonLink } from "@/components/ui/Button";
import { heroImageSrc, heroImageBlur, heroFocalPosition, hangulAlternate, type HeroProps } from "./heroShared";

/**
 * "split" hero — asymmetric editorial: type column on paper against a
 * full-height photograph column. Hairlines, an uppercase kicker, stats as a
 * ruled row. Reads like a magazine opener rather than a landing page.
 */
export default function HeroSplit({ stats }: HeroProps) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale();
  const koName = hangulAlternate(locale);
  const alt = `${site.name} — ${site.tagline}`;

  return (
    <section className="relative bg-bg border-b border-line">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr] lg:min-h-[88svh]">
        {/* ── type column ── */}
        <div className="relative flex flex-col justify-between px-5 sm:px-10 lg:pl-[max(2.5rem,calc((100vw-80rem)/2+2rem))] lg:pr-14 pt-28 lg:pt-36 pb-10 order-2 lg:order-1">
          <div>
            <p className="hero-rise hero-rise-1 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-ink-3">
              {t("location")}
            </p>

            <h1 className="hero-rise hero-rise-2 mt-6 type-display text-ink leading-[0.98] text-[calc(clamp(3.25rem,9vw,7.5rem)*var(--display-scale))] text-balance">
              {site.name}
              {koName && (
                <span className="block text-[0.45em] text-ink-3 mt-3 leading-tight">{koName}</span>
              )}
            </h1>

            <p className="hero-rise hero-rise-3 mt-7 max-w-md text-lg sm:text-xl text-ink-2 leading-relaxed text-pretty">
              {t("heroTagline")}
            </p>
            <p className="hero-rise hero-rise-3 mt-3 max-w-md text-sm text-ink-3">
              {t("heroCredibility")}
            </p>

            <div className="hero-rise hero-rise-4 mt-9 flex flex-wrap gap-3">
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

          {/* stats as a ruled editorial row */}
          <dl className="hero-rise hero-rise-5 mt-14 grid grid-cols-3 border-t border-line pt-6 gap-4">
            {stats.map((stat) => (
              <div key={stat.labelKey}>
                <dt className="sr-only">{t(stat.labelKey)}</dt>
                <dd className="type-display text-2xl sm:text-3xl xl:text-4xl text-ink leading-none">{stat.value}</dd>
                <p className="mt-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3 leading-tight">
                  {t(stat.labelKey)}
                </p>
              </div>
            ))}
          </dl>
        </div>

        {/* ── image column ── */}
        <div className="relative order-1 lg:order-2 aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto lg:min-h-full border-b lg:border-b-0 lg:border-l border-line">
          <Image
            src={heroImageSrc}
            alt={alt}
            fill
            className="object-cover"
            style={{ objectPosition: heroFocalPosition ?? "center 30%" }}
            priority
            placeholder={heroImageBlur ? "blur" : "empty"}
            blurDataURL={heroImageBlur}
            sizes="(max-width: 1024px) 100vw, 48vw"
          />
          {/* mobile: soften the top edge under the navbar */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent lg:hidden" />
        </div>
      </div>
    </section>
  );
}
