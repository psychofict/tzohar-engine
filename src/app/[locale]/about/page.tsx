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
import Eyebrow from "@/components/ui/Eyebrow";

const MOBILE_PREVIEW = 2;

export default function AboutPage() {
  const t = useTranslations("about");
  const tc = useTranslations("common");
  const heroImage = site.brand.heroImage ?? site.brand.ogImage;
  const ctaBackdrop = site.brand.heroImage ?? site.brand.ogImage;
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
        meta={<>{site.location?.from} · {t("basedIn", { location: site.location?.based ?? "" })}</>}
        accent="ocean"
        backgroundImage={heroImage}
        backgroundAlt={site.name}
        imagePosition="74% 16%"
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
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5">
                <div>
                  <dt className="type-label text-ink-3">From</dt>
                  <dd className="type-record text-ink mt-1.5">{site.location?.from}</dd>
                </div>
                <div>
                  <dt className="type-label text-ink-3">Based</dt>
                  <dd className="type-record text-ink mt-1.5">{site.location?.based}</dd>
                </div>
              </dl>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            >
              <div className="mb-6 flex items-center gap-3.5">
                <span className="accent-rule" aria-hidden />
                <Eyebrow>{t("theStory")}</Eyebrow>
                <span className="bg-line h-px flex-1" aria-hidden />
              </div>
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

      {/* CTA — same closing band as the composed pages */}
      <div className="section-invert">
        <section className="band relative overflow-hidden bg-bg">
          <div className="absolute inset-0" aria-hidden="true">
            {/*
              Whatever this build calls its hero plate. This was pointed at one
              client's file, so on every other site the closing band rendered a
              404'd image behind the scrim (or, worse, that client's photograph).
            */}
            <Image src={ctaBackdrop} alt="" fill sizes="100vw" className="object-cover" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(0deg, color-mix(in oklab, #06070B 74%, transparent), color-mix(in oklab, #06070B 58%, transparent))",
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
      </div>
    </main>
  );
}
