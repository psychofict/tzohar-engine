"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";
import { site } from "@/config/site";
import Container from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { heroImageSrc, heroImageBlur, heroFocalPosition, hangulAlternate, type HeroProps } from "./heroShared";

/**
 * "photo" hero — full-bleed photograph as the stage, name + copy laid over
 * bottom-weighted gradient scrims. The classic Tzohar look.
 */
export default function HeroPhoto({ stats }: HeroProps) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale();
  const koName = hangulAlternate(locale);
  const alt = `${site.name} — ${site.tagline}`;

  return (
    <>
      {/* ─── mobile — photo-as-background ─── */}
      <section className="relative lg:hidden overflow-hidden bg-ink min-h-[100svh] flex flex-col">
        <div className="absolute inset-0">
          <Image
            src={heroImageSrc}
            alt={alt}
            fill
            className="object-cover"
            style={{ objectPosition: heroFocalPosition ?? "center 22%" }}
            priority
            placeholder={heroImageBlur ? "blur" : "empty"}
            blurDataURL={heroImageBlur}
            sizes="100vw"
          />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/55 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-black/85 via-black/55 to-transparent" />
        </div>

        <div className="relative z-10 px-5 pt-24 hero-rise hero-rise-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-3 py-1">
            <Sparkles size={14} className="text-sunset" />
            <span className="text-[12px] font-semibold text-white">{t("location")}</span>
          </div>
        </div>

        <div className="relative z-10 mt-auto px-5 pb-24">
          <h1 className="hero-rise hero-rise-2 type-display text-white leading-[1.02] text-[calc(clamp(3rem,12vw,5.5rem)*var(--display-scale))] drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
            {site.name}
            {koName && <span className="ml-3 text-white/85">{koName}</span>}
          </h1>

          <p className="hero-rise hero-rise-3 mt-3 text-base sm:text-lg text-white/95 leading-relaxed text-balance drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]">
            {t("heroTagline")}
          </p>

          <p className="hero-rise hero-rise-3 mt-2 text-[13px] text-white/75 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
            {t("heroCredibility")}
          </p>

          <div className="hero-rise hero-rise-4 mt-5 flex flex-wrap gap-3">
            <ButtonLink href="#roles" size="lg" variant="primary">
              {tc("exploreMyWork")}
              <ArrowRight size={18} />
            </ButtonLink>
            <Link
              href={`/${locale}/contact#booking`}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/35 bg-white/10 backdrop-blur-md px-6 text-[15px] font-semibold text-white hover:bg-white/20 transition-colors"
            >
              {tc("getInTouch")}
            </Link>
          </div>

          <dl className="hero-rise hero-rise-5 mt-6 grid grid-cols-3 gap-3 max-w-md">
            {stats.map((stat) => (
              <div key={stat.labelKey}>
                <dt className="sr-only">{t(stat.labelKey)}</dt>
                <dd className="type-display text-2xl text-white leading-none drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]">{stat.value}</dd>
                <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 leading-tight text-balance">{t(stat.labelKey)}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─── desktop — photo-as-background ─── */}
      <section className="relative hidden lg:flex flex-col justify-end overflow-hidden bg-ink min-h-[92svh]">
        <div className="absolute inset-0">
          <Image
            src={heroImageSrc}
            alt={alt}
            fill
            className="object-cover"
            style={{ objectPosition: heroFocalPosition ?? "center 60%" }}
            priority
            placeholder={heroImageBlur ? "blur" : "empty"}
            blurDataURL={heroImageBlur}
            sizes="100vw"
          />
          {/* Top fade keeps the navbar legible */}
          <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/55 via-black/20 to-transparent" />
          {/* Bottom-heavy fade carries the copy */}
          <div className="absolute inset-x-0 bottom-0 h-[80%] bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
          {/* Left fade strengthens text contrast */}
          <div className="absolute inset-y-0 left-0 w-[62%] bg-gradient-to-r from-black/70 via-black/25 to-transparent" />
        </div>

        <Container size="xl" className="relative z-10 pb-16 xl:pb-20">
          <div className="max-w-2xl">
            <div className="hero-rise hero-rise-1 inline-flex items-center gap-2 rounded-full bg-white/12 backdrop-blur-md border border-white/25 px-3 py-1 mb-6">
              <Sparkles size={14} className="text-sunset" />
              <span className="text-[12px] font-semibold text-white">{t("location")}</span>
            </div>

            <h1 className="hero-rise hero-rise-2 type-display text-white leading-[1.0] text-[calc(clamp(3.5rem,7vw,6.75rem)*var(--display-scale))] drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)]">
              {site.name}
              {koName && <span className="ml-3 text-white/85">{koName}</span>}
            </h1>

            <p className="hero-rise hero-rise-3 mt-5 text-xl xl:text-2xl text-white/95 leading-relaxed text-balance drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]">
              {t("heroTagline")}
            </p>

            <p className="hero-rise hero-rise-3 mt-3 text-[15px] text-white/75 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
              {t("heroCredibility")}
            </p>

            <div className="hero-rise hero-rise-4 mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#roles" size="lg" variant="primary">
                {tc("exploreMyWork")}
                <ArrowRight size={18} />
              </ButtonLink>
              <Link
                href={`/${locale}/contact#booking`}
                className="inline-flex h-13 items-center gap-2 rounded-full border border-white/35 bg-white/10 backdrop-blur-md px-7 text-base font-semibold text-white hover:bg-white/20 transition-colors"
              >
                {tc("getInTouch")}
              </Link>
            </div>

            <dl className="hero-rise hero-rise-5 mt-10 flex flex-wrap gap-x-12 gap-y-6">
              {stats.map((stat) => (
                <div key={stat.labelKey}>
                  <dt className="sr-only">{t(stat.labelKey)}</dt>
                  <dd className="type-display text-4xl text-white leading-none drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]">{stat.value}</dd>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 leading-tight">{t(stat.labelKey)}</p>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>
    </>
  );
}
