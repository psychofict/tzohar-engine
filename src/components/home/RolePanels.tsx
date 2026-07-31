"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { site } from "@/config/site";
import Reveal from "@/components/ui/Reveal";
import { getBlurDataURL } from "@/lib/image-blur";

export interface RolePanel {
  href: string;
  titleKey: string;
  descKey: string;
  ctaKey: string;
  labelKey: string;
  image: string;
  imageAlt: string;
  icon: LucideIcon;
  accent: "ocean" | "sunset";
}

/**
 * The home "what I do" panels in two structural styles:
 * - "cards" (default): soft elevated photo cards in a grid.
 * - "editorial": numbered hairline rows — an index, not a brochure.
 * Selected via `site.layout.sections`.
 */
export default function RolePanels({ panels }: { panels: readonly RolePanel[] }) {
  const style = site.layout?.sections ?? "cards";
  return style === "editorial" ? <EditorialRows panels={panels} /> : <CardGrid panels={panels} />;
}

function CardGrid({ panels }: { panels: readonly RolePanel[] }) {
  const t = useTranslations("home");
  return (
    <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
      {panels.map((p, idx) => {
        const PanelIcon = p.icon;
        return (
          <Reveal key={p.href} delay={idx * 80}>
            <Link
              href={p.href}
              className="group block rounded-card bg-elevated border border-line shadow-card hover:shadow-card-hover transition-all overflow-hidden"
            >
              <div className="relative aspect-video sm:aspect-[5/4] overflow-hidden">
                <Image
                  src={p.image}
                  alt={p.imageAlt}
                  fill
                  className="object-cover group-hover:scale-[1.04] transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  placeholder={getBlurDataURL(p.image) ? "blur" : "empty"}
                  blurDataURL={getBlurDataURL(p.image)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-pill bg-white/90 backdrop-blur px-3 py-1.5">
                  <PanelIcon size={14} className={p.accent === "sunset" ? "text-sunset" : "text-ocean"} />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#15121C]">
                    {t(p.labelKey)}
                  </span>
                </div>
              </div>
              <div className="p-6 sm:p-7">
                <h3 className="text-xl sm:text-2xl font-bold text-ink leading-tight">{t(p.titleKey)}</h3>
                <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">{t(p.descKey)}</p>
                <span
                  className={`mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold ${p.accent === "sunset" ? "text-sunset" : "text-ocean"}`}
                >
                  {t(p.ctaKey)}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}

function EditorialRows({ panels }: { panels: readonly RolePanel[] }) {
  const t = useTranslations("home");
  return (
    <div className="mt-10 sm:mt-14 border-t border-line">
      {panels.map((p, idx) => (
        <Reveal key={p.href} delay={idx * 60}>
          <Link
            href={p.href}
            className="group grid grid-cols-[auto_1fr_auto] md:grid-cols-[80px_minmax(0,1.1fr)_minmax(0,1.4fr)_auto] items-center gap-x-5 md:gap-x-8 gap-y-2 py-7 sm:py-9 border-b border-line hover:bg-surface/60 transition-colors px-2 -mx-2 sm:px-4 sm:-mx-4"
          >
            <span className="type-display text-lg sm:text-xl text-ink-3 tabular-nums leading-none">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <h3 className="type-display text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight group-hover:text-ocean transition-colors">
              {t(p.titleKey)}
            </h3>
            <p className="col-span-full md:col-span-1 md:col-start-3 text-[15px] text-ink-2 leading-relaxed max-w-lg">
              {t(p.descKey)}
            </p>
            <span className="col-start-3 row-start-1 md:col-start-4 justify-self-end inline-flex h-11 w-11 items-center justify-center rounded-pill border border-line-strong text-ink group-hover:bg-ocean group-hover:border-ocean group-hover:text-on-accent transition-colors">
              <ArrowRight size={17} className="group-hover:-rotate-45 transition-transform duration-300" />
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
