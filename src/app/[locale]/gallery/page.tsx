"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Play, Lock, Loader2, ArrowRight } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Lightbox from "@/components/Lightbox";
import { useMembership } from "@/lib/membership";
import { getBlurDataURL } from "@/lib/image-blur";
import { galleryItems, galleryCategories, galleryVideos, type GalleryCategory } from "@/data/gallery";
import { heroes } from "@/data/artist";

type Filter = "all" | GalleryCategory;

export default function GalleryPage() {
  const t = useTranslations("gallery");
  const tp = useTranslations("plans");
  const membership = useMembership();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<number | null>(null);

  const items = useMemo(
    () => (filter === "all" ? galleryItems : galleryItems.filter((i) => i.category === filter)),
    [filter],
  );

  const chips: Filter[] = ["all", ...galleryCategories];

  return (
    <main id="main-content" className="min-h-screen bg-bg text-ink">
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        backgroundImage={heroes.gallery?.image}
        backgroundAlt={heroes.gallery?.alt}
        imagePosition="center 30%"
      />

      {membership.loading ? (
        <Container size="xl" className="flex justify-center py-28">
          <Loader2 className="h-7 w-7 animate-spin text-ink-3" />
        </Container>
      ) : membership.member ? (
        <>
          {/* ─── Filter chips ─── */}
          <Container size="xl" className="pt-10 sm:pt-14">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("filterLabel")}>
              {chips.map((c) => {
                const active = filter === c;
                return (
                  <button
                    key={c}
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setFilter(c);
                      setOpen(null);
                    }}
                    className={`h-9 px-4 rounded-full text-sm font-semibold transition-colors ${
                      active ? "bg-ink text-bg" : "bg-surface text-ink-2 hover:text-ink hover:bg-surface-2"
                    }`}
                  >
                    {c === "all" ? t("all") : t(`cat.${c}`)}
                  </button>
                );
              })}
            </div>
          </Container>

          {/* ─── Masonry grid ─── */}
          <Container size="xl" className="py-8 sm:py-12">
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4">
              {items.map((item, i) => (
                <button
                  key={item.src}
                  onClick={() => setOpen(i)}
                  className="group mb-3 sm:mb-4 block w-full overflow-hidden rounded-xl bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean"
                  aria-label={item.alt}
                >
                  <span className="relative block overflow-hidden">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      width={item.w}
                      height={item.h}
                      className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      placeholder={getBlurDataURL(item.src) ? "blur" : "empty"}
                      blurDataURL={getBlurDataURL(item.src)}
                    />
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="pointer-events-none absolute bottom-0 left-0 right-0 p-3 text-left text-[13px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {item.alt}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </Container>

          <Lightbox
            items={items}
            index={open}
            onIndexChange={setOpen}
            onClose={() => setOpen(null)}
            closeLabel={t("close")}
            prevLabel={t("prev")}
            nextLabel={t("next")}
            downloadLabel={t("download")}
            shareLabel={t("share")}
          />

          {/* ─── Watch (video slots) ─── */}
          <section className="border-t border-line bg-surface py-14 sm:py-20">
            <Container size="xl">
              <SectionHeader eyebrow={t("watchEyebrow")} title={t("watchTitle")} description={t("watchDesc")} align="left" />
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {galleryVideos.length > 0
                  ? galleryVideos.map((v) => (
                      <div key={v.youtubeId} className="overflow-hidden rounded-xl border border-line bg-bg">
                        <div className="relative aspect-video">
                          <iframe
                            className="absolute inset-0 h-full w-full"
                            src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                            title={v.title}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <p className="px-4 py-3 text-sm font-medium text-ink">{v.title}</p>
                      </div>
                    ))
                  : Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-line-strong bg-bg text-ink-3"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
                            <Play size={20} className="text-ink-3" />
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.18em]">{t("videoSlot")}</span>
                        </div>
                      </div>
                    ))}
              </div>
            </Container>
          </section>
        </>
      ) : (
        /* ─── Members-only gate (blurred teaser + join CTA) ─── */
        <Container size="xl" className="py-10 sm:py-14">
          <div className="relative overflow-hidden rounded-2xl">
            {/* Blurred preview — non-interactive, decorative */}
            <div
              aria-hidden="true"
              className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4 max-h-[60vh] overflow-hidden blur-[6px] opacity-50 select-none pointer-events-none"
            >
              {galleryItems.slice(0, 12).map((item) => (
                <div key={item.src} className="mb-3 sm:mb-4 overflow-hidden rounded-xl bg-surface">
                  <Image
                    src={item.src}
                    alt=""
                    width={item.w}
                    height={item.h}
                    className="w-full h-auto"
                    sizes="(max-width: 640px) 50vw, 25vw"
                    placeholder={getBlurDataURL(item.src) ? "blur" : "empty"}
                    blurDataURL={getBlurDataURL(item.src)}
                  />
                </div>
              ))}
            </div>

            {/* Gate card */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-bg via-bg/70 to-bg/30 p-4">
              <div className="w-full max-w-md rounded-2xl border border-line bg-elevated/95 p-7 text-center shadow-card backdrop-blur sm:p-9">
                <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink-2">
                  <Lock size={22} />
                </span>
                <h2 className="text-xl font-bold text-ink">{t("gateTitle")}</h2>
                <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink-2">{t("gateDesc")}</p>
                <p className="mt-3 text-sm font-semibold text-ocean">{t("unlockCount", { count: galleryItems.length })}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                  <Link
                    href="/join"
                    className="inline-flex h-11 items-center gap-1.5 rounded-full bg-ocean px-6 text-[15px] font-semibold text-on-accent hover:bg-ocean-strong transition-colors"
                  >
                    {tp("status.seePlans")} <ArrowRight size={16} />
                  </Link>
                  {!membership.signedIn && (
                    <a
                      href={membership.signInUrl}
                      className="inline-flex h-11 items-center rounded-full border border-line-strong px-6 text-[15px] font-semibold text-ink hover:bg-surface transition-colors"
                    >
                      {tp("status.signIn")}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>
      )}
    </main>
  );
}
