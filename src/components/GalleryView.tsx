"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Lightbox from "@/components/Lightbox";
import type { GalleryCategory, GalleryItem, GalleryVideo } from "@/data/gallery";

type Filter = "all" | GalleryCategory;

/**
 * The members' gallery. Rendered only after the server confirmed a paid membership
 * (src/app/[locale]/gallery/page.tsx); a non-member's page gets GalleryGate instead and never
 * these props.
 */
export default function GalleryView({
  items: allItems,
  categories,
  videos,
}: {
  /** Each photo with its blur placeholder, looked up on the server (src/data/gallery-blur.ts). */
  items: (GalleryItem & { blur?: string })[];
  categories: GalleryCategory[];
  videos: GalleryVideo[];
}) {
  const t = useTranslations("gallery");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<number | null>(null);

  const items = useMemo(
    () => (filter === "all" ? allItems : allItems.filter((i) => i.category === filter)),
    [filter, allItems],
  );

  const chips: Filter[] = ["all", ...categories];

  return (
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
                  placeholder={item.blur ? "blur" : "empty"}
                  blurDataURL={item.blur}
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
            {videos.length > 0
              ? videos.map((v) => (
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
  );
}
