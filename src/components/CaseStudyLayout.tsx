"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import { resolveIcon } from "@/lib/icons";
import type { CaseStudySection } from "@tzohar/schema";

/**
 * Detail-page layout for one case-study entry: a left sticky sidebar (numbered
 * nav generated from the entry's own `sections[]`, active section tracked via
 * scroll-spy) beside scrollable right-hand content. Used by the `innovation`
 * module. `engagements` deliberately does NOT use this — its entries render
 * as simpler stacked prose (see MasterDetailList), no case-study nav needed.
 */
export default function CaseStudyLayout({
  sections,
  backHref,
  backLabel,
  eyebrow,
  title,
  summary,
}: {
  sections: readonly CaseStudySection[];
  backHref: string;
  backLabel: string;
  eyebrow?: string;
  title: string;
  summary?: string;
}) {
  const [activeKey, setActiveKey] = useState(sections[0]?.key ?? "");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveKey(entry.target.id.replace("section-", ""));
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <Container size="xl" className="py-10 sm:py-14">
      <div className="grid lg:grid-cols-[300px_1fr] gap-8 lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink transition-colors">
            <ArrowLeft size={15} />
            {backLabel}
          </Link>

          {eyebrow && (
            <div className="mt-6">
              <Eyebrow>{eyebrow}</Eyebrow>
            </div>
          )}
          <h1 className="mt-2 type-display text-2xl sm:text-3xl text-ink leading-tight">{title}</h1>
          {summary && <p className="mt-3 text-[15px] text-ink-2 leading-relaxed">{summary}</p>}

          <nav className="mt-8 space-y-1 border-t border-line pt-6" aria-label="Case study sections">
            {sections.map((s, i) => {
              const SectionIcon = resolveIcon(s.icon);
              const active = activeKey === s.key;
              return (
                <a
                  key={s.key}
                  href={`#section-${s.key}`}
                  className={`flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-surface text-ink" : "text-ink-3 hover:text-ink hover:bg-surface/60"
                  }`}
                >
                  <span
                    className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      active ? "bg-ocean text-on-accent" : "bg-surface-2 text-ink-3"
                    }`}
                  >
                    {SectionIcon ? <SectionIcon size={14} /> : String(i + 1).padStart(2, "0")}
                  </span>
                  {s.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-10 lg:space-y-14 min-w-0">
          {sections.map((s) => (
            <section
              key={s.key}
              id={`section-${s.key}`}
              ref={(el) => {
                sectionRefs.current[s.key] = el;
              }}
              className="scroll-mt-24"
            >
              <h2 className="text-lg font-semibold text-ink">{s.label}</h2>
              <p className="mt-3 text-[15px] text-ink-2 leading-relaxed whitespace-pre-line">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}
