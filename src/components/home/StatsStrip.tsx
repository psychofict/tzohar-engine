"use client";

import { useTranslations } from "next-intl";
import { site } from "@/config/site";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Stat from "@/components/ui/Stat";
import Reveal from "@/components/ui/Reveal";
import type { HeroStat } from "./heroShared";

/**
 * Home stats in two structural styles (follows `site.layout.sections`):
 * - "cards": the classic centered band on a deep surface.
 * - "editorial": oversized ruled numerals, left-aligned on the page paper.
 */
export default function StatsStrip({ stats }: { stats: readonly HeroStat[] }) {
  const t = useTranslations("home");
  const style = site.layout?.sections ?? "cards";

  if (style === "editorial") {
    return (
      <Section variant="default" className="!py-0">
        <Container size="xl">
          <div className="grid sm:grid-cols-3 border-y border-line">
            {stats.map((s, idx) => (
              <Reveal
                key={s.labelKey}
                delay={idx * 60}
                className={idx > 0 ? "sm:border-l border-line" : undefined}
              >
                <div className="py-10 sm:py-14 sm:px-8 first:pl-0">
                  <p className="type-display text-[calc(clamp(2.75rem,6vw,4.5rem)*var(--display-scale))] text-ink leading-none">
                    {s.value}
                  </p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-3">
                    {t(s.labelKey)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section variant="deep" className="!py-14 sm:!py-16">
      <Container size="lg">
        <div className="grid grid-cols-3 gap-6 sm:gap-10">
          {stats.map((s, idx) => (
            <Reveal key={s.labelKey} delay={idx * 80}>
              <Stat value={s.value} label={t(s.labelKey)} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
