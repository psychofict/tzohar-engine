"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Calendar } from "lucide-react";
import clsx from "clsx";
import type { CaseStudyEntry } from "@tzohar/schema";

/**
 * Persistent list pane (thumbnail + title + date/location) beside a detail
 * pane (hero media + the entry's own `sections[]` as stacked prose + a
 * captioned media gallery). Used by the `engagements` module — deliberately
 * simpler than `innovation`'s `CaseStudyLayout` (no sticky case-study nav,
 * no scroll-spy — an engagement's story is a few short sections, read
 * top-to-bottom, not a long case study worth a jump-nav).
 */
export default function MasterDetailList({ entries }: { entries: readonly CaseStudyEntry[] }) {
  const [selectedSlug, setSelectedSlug] = useState(entries[0]?.slug);
  const selected = entries.find((e) => e.slug === selectedSlug) ?? entries[0];

  if (entries.length === 0) {
    return <p className="text-ink-3 text-sm py-10">Nothing here yet.</p>;
  }

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-6 lg:gap-10">
      <div className="flex gap-3 overflow-x-auto lg:flex-col lg:gap-2 lg:overflow-visible lg:max-h-[75vh] lg:overflow-y-auto lg:pr-2 scrollbar-hide">
        {entries.map((e) => {
          const active = selected?.slug === e.slug;
          return (
            <button
              key={e.slug}
              onClick={() => setSelectedSlug(e.slug)}
              className={clsx(
                "flex-shrink-0 w-64 lg:w-full text-left flex gap-3 rounded-card p-3 border transition-colors",
                active ? "bg-surface border-ocean/30" : "border-transparent hover:bg-surface/60",
              )}
            >
              <div className="relative w-16 h-16 flex-shrink-0 rounded-card overflow-hidden bg-surface-2">
                <Image src={e.heroImage} alt="" fill className="object-cover" sizes="64px" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-ink text-sm leading-tight line-clamp-2">{e.title}</h3>
                {(e.location || e.date) && (
                  <p className="text-xs text-ink-3 mt-1.5 truncate">{[e.location, e.date].filter(Boolean).join(" · ")}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="min-w-0">{selected && <EntryDetail entry={selected} />}</div>
    </div>
  );
}

function EntryDetail({ entry }: { entry: CaseStudyEntry }) {
  return (
    <article>
      <h2 className="text-2xl sm:text-3xl font-bold text-ink leading-tight">{entry.title}</h2>
      {(entry.location || entry.date) && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-3 mt-2">
          {entry.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} /> {entry.location}
            </span>
          )}
          {entry.date && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} /> {entry.date}
            </span>
          )}
        </div>
      )}

      <div className="relative mt-6 aspect-video rounded-card overflow-hidden bg-surface-2">
        {entry.heroVideo ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={entry.heroVideo} poster={entry.heroImage} controls className="h-full w-full object-cover" />
        ) : (
          <Image src={entry.heroImage} alt={entry.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 60vw" />
        )}
      </div>

      <div className="mt-8 space-y-7">
        {entry.sections.map((s) => (
          <div key={s.key}>
            <h3 className="font-semibold text-ink mb-2">{s.label}</h3>
            <p className="text-[15px] text-ink-2 leading-relaxed whitespace-pre-line">{s.body}</p>
          </div>
        ))}
      </div>

      {entry.media && entry.media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8">
          {entry.media.map((m) => (
            <figure key={m.src}>
              <div className="relative aspect-[4/3] rounded-card overflow-hidden bg-surface-2">
                <Image src={m.src} alt={m.alt} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
              </div>
              {m.caption && <figcaption className="text-xs text-ink-3 mt-1.5">{m.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </article>
  );
}
