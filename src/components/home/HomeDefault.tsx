"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight, Music as MusicIcon, BrainCircuit, Globe2 } from "lucide-react";
import { site, hasModule } from "@/config/site";
import { homeStats, credibilityLogos, rolePanels, spotlight, latestRelease } from "@/data/home";
import { getComposedPage } from "@/data/pages";
import PreviewablePage from "@/components/preview/PreviewablePage";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import SectionHeader from "@/components/ui/SectionHeader";
import Eyebrow from "@/components/ui/Eyebrow";
import { ButtonLink } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { getBlurDataURL } from "@/lib/image-blur";
import HomeHero from "@/components/home/HomeHero";
import RolePanels, { type RolePanel } from "@/components/home/RolePanels";
import StatsStrip from "@/components/home/StatsStrip";
import type { HeroStat } from "@/components/home/heroShared";

export default function HomePage() {
  // A composed "home" page (pages module) replaces the default composition.
  const composedHome = hasModule("pages") ? getComposedPage("home") : undefined;
  if (composedHome) return <PreviewablePage slug="home" page={composedHome} />;
  return <DefaultHome />;
}

/** Panel artwork lives in content; the icon component cannot, so it maps by name. */
const PANEL_ICONS = { music: MusicIcon, research: BrainCircuit, influence: Globe2 } as const;

function DefaultHome() {
  const t = useTranslations("home");
  const tc = useTranslations("common");

  /*
   * Every section below is optional. This page used to hardcode the reference
   * build's numbers, partner logos, photographs and album, so a client with none
   * of that still rendered all of it — behind links to modules they had switched
   * off. Now each block appears only if this site has the content AND runs the
   * module it points into.
   */
  const panels: RolePanel[] = rolePanels
    .filter((p) => hasModule(p.module))
    .map((p) => ({ ...p, icon: PANEL_ICONS[p.icon] }));
  const showSpotlight = spotlight && hasModule(spotlight.module);
  const showRelease = latestRelease && hasModule(latestRelease.module);

  return (
    <main id="main-content" className="min-h-screen bg-bg">
      <HomeHero stats={homeStats} />

      {/* ─── CREDIBILITY MARQUEE ─── */}
      {credibilityLogos.length > 0 && (
      <section aria-label={t("asFeaturedIn")} className="relative bg-bg py-10 sm:py-14 overflow-hidden border-y border-line">
        <Container size="xl">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3 mb-7">
            {t("asFeaturedIn")}
          </p>
          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />
            <div className="flex animate-marquee">
              {[...credibilityLogos, ...credibilityLogos].map((logo, i) => (
                <div key={`${logo.name}-${i}`} className="flex-shrink-0 mx-7 sm:mx-9 logo-muted">
                  <Image src={logo.src} alt={logo.name} height={36} width={140} className="h-7 sm:h-9 w-auto object-contain" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
      )}

      {/* ─── WHERE I OPERATE ─── */}
      {panels.length > 0 && (
      <Section id="roles" variant="default">
        <Container size="xl">
          <SectionHeader
            eyebrow={t("whatIDo")}
            title={t("whereIOperate")}
            description={t("whereIOperateDesc")}
          />
          <RolePanels panels={panels} />
        </Container>
      </Section>
      )}

      {/* ─── FEATURED MOMENT ─── */}
      {showSpotlight && (
      <Section variant="muted">
        <Container size="xl">
          <Reveal className="rounded-card bg-elevated border border-line shadow-card overflow-hidden">
            <div className="grid md:grid-cols-2 min-h-[360px] sm:min-h-[440px]">
              <div className="relative aspect-[4/3] md:aspect-auto">
                <a href={spotlight!.href} target="_blank" rel="noopener noreferrer" className="block h-full">
                  <Image
                    src={spotlight!.image}
                    alt={`${site.name} — ${spotlight!.imageAlt}`}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    placeholder={getBlurDataURL(spotlight!.image) ? "blur" : "empty"}
                    blurDataURL={getBlurDataURL(spotlight!.image)}
                  />
                </a>
              </div>
              <div className="p-7 sm:p-10 md:p-14 flex flex-col justify-center">
                <Eyebrow>{t("spotlight")}</Eyebrow>
                <h2 className="mt-3 type-display text-2xl sm:text-3xl md:text-4xl text-ink leading-tight">{t("spotlightTitle")}</h2>
                <p className="mt-4 text-[15px] sm:text-base text-ink-2 leading-relaxed">{t("spotlightDesc")}</p>
                <div className="mt-6">
                  <Link
                    href={spotlight!.link}
                    className="inline-flex items-center gap-2 text-sunset font-semibold hover:text-sunset-strong transition-colors"
                  >
                    {t("spotlightCTA")}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
      )}

      {/* ─── LATEST RELEASE ─── */}
      {showRelease && (
      <Section variant="default">
        <Container size="lg">
          <Reveal className="grid grid-cols-1 sm:grid-cols-[260px_1fr] gap-7 sm:gap-10 items-center rounded-card bg-elevated border border-line p-6 sm:p-8">
            <Image
              src={latestRelease!.cover}
              alt={latestRelease!.title}
              width={520}
              height={520}
              className="w-full max-w-[260px] sm:max-w-none mx-auto sm:mx-0 rounded-card shadow-card"
              placeholder={getBlurDataURL(latestRelease!.cover) ? "blur" : "empty"}
              blurDataURL={getBlurDataURL(latestRelease!.cover)}
            />
            <div>
              <Eyebrow>{t("latestRelease")}</Eyebrow>
              <h3 className="mt-2 type-display text-2xl sm:text-3xl text-ink leading-tight">{latestRelease!.title}</h3>
              <p className="mt-1 text-sm text-ink-3">{latestRelease!.year}{latestRelease!.artist ? ` · ${latestRelease!.artist}` : ""}</p>
              <p className="mt-4 text-[15px] sm:text-base text-ink-2 leading-relaxed">{t("albumDesc")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href={latestRelease!.listenUrl} target="_blank" rel="noopener noreferrer" size="md" variant="primary">
                  {tc("listenNow")}
                </ButtonLink>
                <Link
                  href="/music"
                  className="inline-flex items-center gap-1.5 h-11 px-5 rounded-pill border border-line-strong text-[15px] font-semibold text-ink hover:bg-surface transition-colors"
                >
                  {t("fullDiscography")}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
      )}

      {homeStats.length > 0 && <StatsStrip stats={homeStats} />}

      {/* ─── CTA ─── */}
      <Section variant="default" className="!pb-20">
        <Container size="md">
          <Reveal className="relative rounded-card overflow-hidden p-8 sm:p-12 lg:p-16 text-center bg-gradient-to-br from-ink to-ink-2 text-bg">
            <Eyebrow>{tc("collaborate")}</Eyebrow>
            <h2 className="mt-4 type-display text-3xl sm:text-4xl md:text-5xl leading-tight">{t("letsBuild")}</h2>
            <p className="mt-4 sm:mt-5 max-w-xl mx-auto text-base sm:text-lg text-bg/80 leading-relaxed">{t("collabDesc")}</p>
            <div className="mt-7 sm:mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/contact#booking"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-pill bg-bg text-ink font-semibold hover:bg-surface transition-colors"
              >
                {tc("getInTouch")}
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-pill border border-bg/20 text-bg font-semibold hover:bg-bg/10 transition-colors"
              >
                {tc("learnMore")}
              </Link>
            </div>
          </Reveal>
        </Container>
      </Section>
    </main>
  );
}
