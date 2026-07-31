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
 * "portrait" hero — warm and personal: a portrait card backed by an accent
 * slab, with the display name overlapping the photo edge and stat chips
 * floating on the image. For creators whose face is the brand.
 */
export default function HeroPortrait({ stats }: HeroProps) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale();
  const koName = hangulAlternate(locale);
  const alt = `${site.name} — ${site.tagline}`;
  const [primaryStat, ...restStats] = stats;

  return (
    <section className="relative overflow-hidden bg-surface border-b border-line">
      <Container size="xl" className="relative z-10 pt-28 lg:pt-36 pb-16 lg:pb-24">
        <div className="grid gap-12 lg:gap-8 lg:grid-cols-[1.05fr_0.95fr] items-center">
          {/* ── copy ── */}
          <div className="order-2 lg:order-1">
            <div className="hero-rise hero-rise-1 inline-flex items-center gap-2 rounded-pill bg-elevated border border-line px-3 py-1 shadow-card">
              <Sparkles size={14} className="text-sunset" />
              <span className="text-[12px] font-semibold text-ink">{t("location")}</span>
            </div>

            <h1 className="hero-rise hero-rise-2 mt-6 type-display text-ink leading-[1.0] text-[calc(clamp(3rem,8vw,6.5rem)*var(--display-scale))] text-balance lg:relative lg:z-10 lg:-mr-24">
              {site.name}
              {koName && <span className="ml-3 text-[0.5em] text-ink-3 align-middle">{koName}</span>}
            </h1>

            <p className="hero-rise hero-rise-3 mt-6 max-w-md text-lg sm:text-xl text-ink-2 leading-relaxed text-pretty">
              {t("heroTagline")}
            </p>
            <p className="hero-rise hero-rise-3 mt-3 max-w-md text-sm text-ink-3">
              {t("heroCredibility")}
            </p>

            <div className="hero-rise hero-rise-4 mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#roles" size="lg" variant="primary">
                {tc("exploreMyWork")}
                <ArrowRight size={18} />
              </ButtonLink>
              <Link
                href={`/${locale}/contact#booking`}
                className="inline-flex h-12 items-center gap-2 rounded-pill border border-line-strong px-6 text-[15px] font-semibold text-ink hover:bg-elevated transition-colors"
              >
                {tc("getInTouch")}
              </Link>
            </div>

            {restStats.length > 0 && (
              <dl className="hero-rise hero-rise-5 mt-10 flex flex-wrap gap-x-10 gap-y-5">
                {restStats.map((stat) => (
                  <div key={stat.labelKey}>
                    <dt className="sr-only">{t(stat.labelKey)}</dt>
                    <dd className="type-display text-3xl text-ink leading-none">{stat.value}</dd>
                    <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3 leading-tight">
                      {t(stat.labelKey)}
                    </p>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* ── portrait card ── */}
          <div className="order-1 lg:order-2 relative hero-rise hero-rise-2">
            {/* accent slab behind the portrait */}
            <div
              aria-hidden
              className="absolute -inset-2 sm:-inset-3 rotate-[1.5deg] rounded-card opacity-25"
              style={{ background: "linear-gradient(135deg, var(--color-ocean), var(--color-sunset))" }}
            />
            <div className="relative aspect-[4/5] rounded-card overflow-hidden border border-line shadow-card">
              <Image
                src={heroImageSrc}
                alt={alt}
                fill
                className="object-cover"
                style={{ objectPosition: heroFocalPosition ?? "center 25%" }}
                priority
                placeholder={heroImageBlur ? "blur" : "empty"}
                blurDataURL={heroImageBlur}
                sizes="(max-width: 1024px) 100vw, 44vw"
              />
            </div>
            {/* floating headline stat */}
            {primaryStat && (
              <div className="absolute -bottom-5 left-5 sm:left-8 glass-card px-5 py-4 shadow-card">
                <p className="type-display text-2xl sm:text-3xl text-ink leading-none">{primaryStat.value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">
                  {t(primaryStat.labelKey)}
                </p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
