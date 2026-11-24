"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { site } from "@/config/site";
import { fadeUp } from "@/lib/animations";
import PageHero from "@/components/ui/PageHero";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import { optionalMessage } from "@/lib/optional-message";
import { pageHeroPosition } from "@/lib/hero-focal";

const MOBILE_PREVIEW = 2;

export default function AboutPage() {
  const t = useTranslations("about");
  const tc = useTranslations("common");
  const heroImage = site.brand.heroImage ?? site.brand.ogImage;
  /*
   * The closing band's picture is the site's own hero photograph, or none. It used to fall back to
   * the 1200x630 sharing image, which a phone-height band stretched to about twice its size.
   */
  const ctaBackdrop = site.brand.heroImage;
  const bioParagraphs = t("bioIntro").split("\n\n");
  const [bioExpanded, setBioExpanded] = useState(false);
  const previewParagraphs = bioParagraphs.slice(0, MOBILE_PREVIEW);
  const restParagraphs = bioParagraphs.slice(MOBILE_PREVIEW);

  return (
    <main id="main-content" className="min-h-screen bg-bg">
      <PageHero
        eyebrow={t("theStory")}
        title={`${t("aboutTitle")} ${site.name}`}
        subtitle={site.tagline}
        meta={
          // Either place may be unset; a lone "·" or an empty "Based in" reads as a fault.
          [site.location?.from, site.location?.based ? t("basedIn", { location: site.location.based }) : ""]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        accent="ocean"
        backgroundImage={heroImage}
        backgroundAlt={site.name}
        imagePosition={pageHeroPosition}
      />

      {/* Portrait + bio */}
      <Section variant="default">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10 lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="relative aspect-4/5 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-2">
                <Image
                  src={heroImage}
                  alt={site.name}
                  fill
                  className="object-cover object-[center_25%]"
                  sizes="(max-width: 1024px) 100vw, 300px"
                />
              </div>
              {(site.location?.from || site.location?.based) && (
                <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5">
                  {site.location?.from && (
                    <div>
                      <dt className="type-label text-ink-3">{optionalMessage(t, "fromLabel", "From")}</dt>
                      <dd className="type-record text-ink mt-1.5">{site.location.from}</dd>
                    </div>
                  )}
                  {site.location?.based && (
                    <div>
                      <dt className="type-label text-ink-3">{optionalMessage(t, "basedLabel", "Based")}</dt>
                      <dd className="type-record text-ink mt-1.5">{site.location.based}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            >
              {/* No second "The story" label here: the hero above already carries it. */}
              <h2 className="type-display text-ink text-balance leading-[1.14] text-[calc(clamp(1.625rem,3vw,2.5rem)*var(--display-scale))]">
                {t("aboutHeading")}
              </h2>
              <div className="mt-7 space-y-5">
                {/* Mobile: preview only; desktop: full bio always */}
                {previewParagraphs.map((paragraph, i) => (
                  <motion.p
                    key={i}
                    variants={fadeUp}
                    className="text-ink-2 measure text-[16px] sm:text-[17px] leading-[1.75]"
                  >
                    {paragraph}
                  </motion.p>
                ))}
                {/* Hidden on mobile until expanded; always shown on lg+ */}
                <div className={`space-y-5 ${bioExpanded ? "" : "hidden lg:block"}`}>
                  {restParagraphs.map((paragraph, i) => (
                    <p
                      key={i}
                      className="text-ink-2 measure text-[16px] sm:text-[17px] leading-[1.75]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                <AnimatePresence initial={false}>
                  {bioExpanded && (
                    <motion.div
                      key="rest-anim"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="lg:hidden"
                    />
                  )}
                </AnimatePresence>
              </div>
              {restParagraphs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setBioExpanded((v) => !v)}
                  aria-expanded={bioExpanded}
                  className="lg:hidden mt-7 inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink hover:bg-surface transition-colors"
                >
                  {bioExpanded ? tc("readLess") : tc("readMore")}
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${bioExpanded ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* CTA: the closing band, on the site's own theme (a light wash in light mode, dark only in the dark option) */}
      <section className="band relative overflow-hidden bg-bg">
        <div className="absolute inset-0" aria-hidden="true">
          {/*
            Whatever this build calls its hero plate. This was pointed at one
            client's file, so on every other site the closing band rendered a
            404'd image behind the scrim (or, worse, that client's photograph).
            The wash comes from the theme's own `--color-bg` token. It was a fixed
            near-black scrim inside `.section-invert`, so every light site ended
            its About page on a dark band (found 24 Nov 2026 on the Kopje Light demo).
          */}
          {ctaBackdrop && <Image src={ctaBackdrop} alt="" fill sizes="100vw" className="object-cover" />}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, color-mix(in oklab, var(--color-bg) 88%, transparent), color-mix(in oklab, var(--color-bg) 78%, transparent))",
            }}
          />
        </div>
        <Container size="xl" className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <span className="accent-rule mx-auto mb-8" aria-hidden />
            <h2 className="type-display text-ink text-balance leading-[1.14] text-[calc(clamp(1.75rem,3.4vw,2.625rem)*var(--display-scale))]">
              {t("letsBuildTitle")}
            </h2>
            <p className="text-ink-2 mx-auto mt-5 max-w-xl text-[17px] leading-relaxed">{t("letsBuildDesc")}</p>
            <Link
              href="/contact"
              className="bg-ocean text-on-accent hover:bg-ocean-strong mt-9 inline-flex h-12 items-center gap-2 rounded-[var(--radius-pill)] px-7 font-semibold transition-colors"
            >
              {tc("getInTouch")}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
