"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Download, ExternalLink, Mail, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import SectionHeader from "@/components/ui/SectionHeader";
import { ButtonLink } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import JourneyMap from "@/components/JourneyMap";
import Timeline from "@/components/ui/Timeline";
import MediaKitBuilder from "@/components/MediaKitBuilder";
import { site } from "@/config/site";
import { heroIntro, achievements, journeyStops, educationTimeline, story, futurePlans } from "@/data/biography";
import { cvUrl, portfolioUrl } from "@/data/research";

export default function BiographyPage() {
  const t = useTranslations("biography");
  const heroImage = site.brand.heroImage ?? site.brand.ogImage;

  const timelineItems = educationTimeline.map((m, i) => ({
    key: `${m.title}-${i}`,
    title: m.title,
    place: m.place,
    period: m.period,
    note: m.note,
    photo: m.photo,
  }));

  return (
    <main id="main-content" className="min-h-screen bg-bg">
      {/* ─── HERO ─── */}
      <Section
        variant="default"
        className={`!pt-28 sm:!pt-32 ${site.layout?.heroTone === "dark" ? "section-invert border-b border-line" : ""}`}
      >
        <Container size="xl">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean mb-3">{t("eyebrow")}</p>
              <h1 className="type-display text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight">{t("title")}</h1>
              <p className="mt-5 text-base sm:text-lg text-ink-2 leading-relaxed max-w-xl">{heroIntro}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                {cvUrl && (
                  <ButtonLink href={cvUrl} target="_blank" rel="noopener noreferrer" variant="primary" size="md">
                    <Download size={16} /> {t("downloadCV")}
                  </ButtonLink>
                )}
                <Link
                  href="/contact"
                  className="inline-flex h-11 items-center gap-2 rounded-pill border border-line-strong px-6 text-[15px] font-semibold text-ink hover:bg-surface transition-colors"
                >
                  <Mail size={16} /> {t("contactMe")}
                </Link>
                {portfolioUrl && (
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-pill border border-line-strong px-6 text-[15px] font-semibold text-ink hover:bg-surface transition-colors"
                  >
                    {t("viewPortfolio")} <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="grid gap-4">
                <div className="relative aspect-[4/5] rounded-card overflow-hidden border border-line shadow-card">
                  <Image src={heroImage} alt={site.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 40vw" />
                </div>
                <ul className="space-y-3">
                  {achievements.map((a) => (
                    <li key={a} className="flex items-start gap-2.5 text-sm text-ink-2">
                      <CheckCircle2 size={15} className="text-ocean flex-shrink-0 mt-0.5" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ─── JOURNEY MAP ─── */}
      <Section variant="muted">
        <Container size="xl">
          <SectionHeader
            eyebrow={t("journeyEyebrow")}
            title={t("journeyTitle")}
            description={t("journeyDesc")}
            align="left"
          />
          <div className="mt-8">
            <JourneyMap stops={journeyStops} />
          </div>
        </Container>
      </Section>

      {/* ─── EDUCATION TIMELINE ─── */}
      <Section variant="default">
        <Container size="xl">
          <SectionHeader eyebrow={t("timelineEyebrow")} title={t("timelineTitle")} align="left" />
          <div className="mt-8">
            <Timeline items={timelineItems} orientation="horizontal" numbered />
          </div>
        </Container>
      </Section>

      {/* ─── STORY ─── */}
      <Section variant="muted">
        <Container size="md">
          <SectionHeader eyebrow={t("storyEyebrow")} title={t("storyTitle")} align="left" />
          <p className="mt-6 text-[15px] sm:text-base text-ink-2 leading-relaxed whitespace-pre-line">{story}</p>
        </Container>
      </Section>

      {/* ─── FUTURE PLANS ─── */}
      <Section variant="default">
        <Container size="lg">
          <SectionHeader eyebrow={t("futureEyebrow")} title={t("futureTitle")} align="left" />
          <ul className="mt-8 grid sm:grid-cols-2 gap-4">
            {futurePlans.map((p) => (
              <li key={p} className="flex items-start gap-3 rounded-card border border-line bg-elevated p-4 text-sm text-ink-2">
                <CheckCircle2 size={16} className="text-ocean flex-shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ─── MEDIA KIT BUILDER ─── */}
      <Section variant="muted">
        <Container size="md">
          <MediaKitBuilder />
        </Container>
      </Section>
    </main>
  );
}
