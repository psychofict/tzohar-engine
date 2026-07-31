"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import type { z } from "zod";
import type {
  heroBlockSchema,
  logoStripBlockSchema,
  pillarsBlockSchema,
  statementBlockSchema,
  statsBlockSchema,
  cardGridBlockSchema,
  iconListBlockSchema,
  mediaTextBlockSchema,
  timelineBlockSchema,
  tableBlockSchema,
  quoteBlockSchema,
  ctaBlockSchema,
  BlockButton,
  BlockHeader,
} from "@tzohar/schema";
import { ArrowRight, ExternalLink, ChevronDown } from "lucide-react";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/ui/Reveal";
import Timeline from "@/components/ui/Timeline";
import { ButtonLink } from "@/components/ui/Button";
import { resolveIcon } from "@/lib/icons";

/*
 * Leaf block renderers. Every component is theme-token driven (bg-bg, text-ink,
 * text-ocean, border-line…), so blocks recolor with the site's accent/paper and
 * flip correctly inside a `.section-invert` dark band.
 *
 * Two rules hold this set together:
 *
 * 1. ONE container width. Every block uses `Container size="xl"`, and reading
 *    width is limited *inside* it with `.measure`. Blocks used to pick their own
 *    container (`md` for icon lists, `lg` for quotes, `xl` for grids), so the
 *    left edge of the page jumped by ~130px between consecutive sections and
 *    nothing lined up with anything.
 *
 * 2. The accent is SIGNAL, not decoration. It appears as a filled button, a
 *    short rule beside a section label, an active state, or a display-scale
 *    quote mark — never as 13–16px text or a 16px icon. Small structural marks
 *    are ink; see Eyebrow for the measurements behind that rule.
 */

// ── shared bits ─────────────────────────────────────────────────────────────

const BTN_VARIANT: Record<NonNullable<BlockButton["style"]>, "primary" | "outline" | "ghost"> = {
  primary: "primary",
  outline: "outline",
  ghost: "ghost",
};

export function BlockButtons({ buttons, className }: { buttons?: BlockButton[]; className?: string }) {
  if (!buttons?.length) return null;
  return (
    <div className={clsx("flex flex-wrap gap-3", className)}>
      {buttons.map((b, i) => (
        <ButtonLink key={i} href={b.href} variant={BTN_VARIANT[b.style ?? (i === 0 ? "primary" : "outline")]}>
          {b.label}
          <ArrowRight size={16} aria-hidden />
        </ButtonLink>
      ))}
    </div>
  );
}

/**
 * The register rule: accent tick, mono label, then a hairline running to the
 * right margin.
 *
 * This is the device that carries the whole page system. It ties every section
 * to one left edge, states where a section begins without needing a wall of
 * padding to do it, and — because the rule spans the full column — gives the
 * right-hand side of a text-only section something to be. Sections here used to
 * leave the entire right half of a 1440px viewport empty.
 */
function RegisterRule({ label, className }: { label: string; className?: string }) {
  return (
    <div className={clsx("flex items-center gap-3.5", className)}>
      <span className="accent-rule" aria-hidden />
      <Eyebrow>{label}</Eyebrow>
      <span className="bg-line h-px flex-1" aria-hidden />
    </div>
  );
}

/** Standard header. `sideNote` moves supporting prose into a marginalia column. */
export function BlockHeaderRow({ header }: { header?: BlockHeader }) {
  if (!header || (!header.eyebrow && !header.title && !header.description && !header.sideNote)) return null;
  // An eyebrow-only header is a label on a rule, not a header block — it doesn't
  // earn the full 3rem gap that a title plus standfirst does.
  const labelOnly = !header.title && !header.description && !header.sideNote;
  return (
    <header className={labelOnly ? "mb-7" : "mb-10 sm:mb-12"}>
      {header.eyebrow && <RegisterRule label={header.eyebrow} className={labelOnly ? undefined : "mb-6"} />}
      <div
        className={clsx(
          "grid gap-x-12 gap-y-5",
          header.sideNote && "lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]",
        )}
      >
        <div>
          {header.title && (
            <h2 className="type-display text-ink text-balance leading-[1.12] text-[calc(clamp(1.625rem,3vw,2.5rem)*var(--display-scale))]">
              {header.title}
            </h2>
          )}
          {header.description && (
            <p className="text-ink-2 measure mt-4 text-base leading-relaxed sm:text-[17px]">{header.description}</p>
          )}
        </div>
        {header.sideNote && (
          <p className="text-ink-2 border-line measure-sm text-[15px] leading-relaxed lg:border-l lg:pl-10">
            {header.sideNote}
          </p>
        )}
      </div>
    </header>
  );
}

/**
 * Bordered plate holding an icon or a literal marker.
 *
 * The accent tint fill this used to carry (`color-mix(ocean 13%)` behind an
 * accent-colored glyph) put a gold-on-gold roundel next to every list item on
 * the page — dozens of them, all competing, none meaning anything. A hairline
 * plate with an ink glyph recedes and works on any of the four band tones.
 */
function Marker({ icon, marker, size = "md" }: { icon?: string; marker?: string; size?: "sm" | "md" }) {
  const Icon = resolveIcon(icon);
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <span
      className={clsx(
        dim,
        "border-line-strong text-ink-2 flex flex-none items-center justify-center rounded-[calc(var(--radius-card)*0.5)] border",
      )}
      aria-hidden
    >
      {marker ? (
        <span className="type-label text-ink text-[13px] tracking-normal">{marker}</span>
      ) : Icon ? (
        <Icon size={size === "sm" ? 15 : 18} strokeWidth={1.6} />
      ) : (
        <span className="bg-ink-3 h-1 w-1 rounded-full" />
      )}
    </span>
  );
}

/** Hairline chip. Transparent so it reads correctly on all four band tones. */
function Tag({ children, large }: { children: React.ReactNode; large?: boolean }) {
  return (
    <span
      className={clsx(
        "border-line-strong text-ink-2 inline-flex items-center gap-2 rounded-[calc(var(--radius-card)*0.5)] border",
        large ? "px-4 py-2 text-[13.5px] font-medium" : "type-label px-2.5 py-1.5",
      )}
    >
      {children}
    </span>
  );
}

const scriptFont = { fontFamily: "var(--font-script, cursive)" };

/**
 * Signature line — the site's script tagline, set once at the foot of a hero.
 *
 * It used to sit centred between two symmetrical accent hairline gradients, in
 * accent color: the exact "premium" flourish that reads as template dressing.
 * As a single ink line above one short rule it reads as what it is — a personal
 * line signed under a statement.
 */
function SignatureLine({ text }: { text: string }) {
  return (
    <div className="mt-10 flex flex-col gap-2.5">
      <span className="bg-line-strong h-px w-16" aria-hidden />
      <p className="text-ink-2 text-[21px] leading-snug" style={scriptFont}>
        {text}
      </p>
    </div>
  );
}

/**
 * Mono `label / value` record row — the fixed facts under a hero.
 *
 * Column count follows the item count instead of being fixed at three: four
 * facts in a three-column grid leave a 3 + 1 orphan row, which reads as a
 * layout accident rather than a set.
 *
 * HIDDEN BELOW `sm`. On a phone the grid collapses to one column, so four facts
 * become ~200px of label/value pairs wedged between the hero's buttons and the
 * next section — which pushed the affiliations marquee, the thing that actually
 * establishes credibility at a glance, entirely below the fold. The facts are
 * kept in the DOM (`hidden`, not unmounted) so they stay available to crawlers
 * and assistive tech, and they still carry the desktop hero where the row is a
 * single tidy line.
 */
function RecordRow({ items, className }: { items: { label: string; value: string }[]; className?: string }) {
  if (!items.length) return null;
  const cols = items.length % 3 === 0 ? "sm:grid-cols-3" : items.length % 2 === 0 ? "sm:grid-cols-2" : "sm:grid-cols-3";
  return (
    <dl className={clsx("border-line hidden gap-x-10 gap-y-5 border-t pt-6 sm:grid", cols, className)}>
      {items.map((r, i) => (
        <div key={i}>
          <dt className="type-label text-ink-3">{r.label}</dt>
          <dd className="type-record text-ink mt-1.5">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function multiline(text: string) {
  const parts = text.split("\n");
  return parts.map((line, i) => (
    <span key={i}>
      {line}
      {i < parts.length - 1 && <br />}
    </span>
  ));
}

/**
 * Image capped by HEIGHT as well as width.
 *
 * A `next/image` with fixed width/height attributes and `w-full` lays out at
 * the *file's* intrinsic ratio, so a portrait source in a half-width column
 * grows as tall as it likes — a 260×568 collage rendered ~1400px tall next to a
 * 200px block of text, and got upscaled 2.7× on the way. Capping height and
 * letting width follow keeps any orientation inside a sane box and keeps small
 * sources near their native size instead of interpolating them.
 */
function Plate({
  src,
  alt,
  maxH = "clamp(20rem, 46vw, 34rem)",
  className,
}: {
  src: string;
  alt: string;
  maxH?: string;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={900}
      sizes="(max-width: 1024px) 92vw, 46vw"
      className={clsx("border-line h-auto w-auto max-w-full border object-contain", className)}
      style={{ maxHeight: maxH, borderRadius: "var(--radius-card)" }}
    />
  );
}

// ── hero ────────────────────────────────────────────────────────────────────

export function HeroBlock({ block }: { block: z.infer<typeof heroBlockSchema> }) {
  const variant = block.variant ?? "banner";
  // A full-bleed `background` (rendered by BlockRenderer) turns the hero
  // cinematic: copy sits over the photo, so the framed side card is dropped.
  const hasBg = !!block.background;
  const sideImage = !!block.image && !hasBg;
  return (
    <Container size="xl">
      <div className={clsx("grid items-center gap-12", sideImage && "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]")}>
        <Reveal direction="up">
          {/*
            Over a photograph the copy column is capped near 46% of the band and
            the scrim (see scrimFor) is tuned to that width. Previously the
            column was `max-w-3xl` — about 62% of a 1440px viewport — which ran
            the headline straight across the subject's face at roughly 2:1
            contrast, and on mobile covered the portrait entirely.
          */}
          <div className={clsx(hasBg ? "max-w-xl lg:max-w-[46%] lg:min-w-[34rem]" : "max-w-2xl")}>
            {block.eyebrow && <RegisterRule label={block.eyebrow} className="mb-7" />}
            {block.title && (
              <h1
                className={clsx(
                  "type-display text-ink text-balance leading-[1.06]",
                  // Sized against the ~46% copy column, not the viewport: at the
                  // previous scale a four-word line like "From the bench to" broke
                  // across two lines inside the column even with text-balance.
                  hasBg
                    ? "text-[calc(clamp(2.25rem,4.6vw,3.75rem)*var(--display-scale))]"
                    : "text-[calc(clamp(2.25rem,5vw,4rem)*var(--display-scale))]",
                )}
              >
                {multiline(block.title)}
              </h1>
            )}
            {block.role && <p className="type-label text-ink-2 mt-5">{block.role}</p>}
            {variant === "quote" && block.quote && (
              <blockquote className="mt-7">
                <p className="text-ink text-[clamp(1.25rem,1.9vw,1.6rem)] font-medium leading-[1.45]">
                  <span
                    className="text-ocean-strong mr-1 align-[-0.18em] text-[2.1em] leading-none"
                    aria-hidden
                  >
                    &ldquo;
                  </span>
                  {block.quote}
                </p>
                {block.quoteAttribution && (
                  <footer className="type-label text-ink-3 mt-4">— {block.quoteAttribution}</footer>
                )}
              </blockquote>
            )}
            {block.description && (
              <p className="text-ink-2 measure-sm mt-6 text-[17px] leading-relaxed">{block.description}</p>
            )}
            <BlockButtons buttons={block.buttons} className="mt-9" />
            {block.record && block.record.length > 0 && <RecordRow items={block.record} className="mt-11" />}
            {block.tagline && <SignatureLine text={block.tagline} />}
          </div>
        </Reveal>
        {sideImage && (
          <Reveal direction="up" delay={120}>
            <div className="w-full justify-self-end">
              <Plate src={block.image!} alt={block.imageAlt ?? ""} maxH="clamp(22rem, 52vw, 32rem)" />
            </div>
          </Reveal>
        )}
      </div>
    </Container>
  );
}

// ── logo strip ──────────────────────────────────────────────────────────────

const LOGO_FADE = "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)";

export function LogoStripBlock({ block }: { block: z.infer<typeof logoStripBlockSchema> }) {
  const logos = block.logos ?? [];
  const marquee = block.variant === "marquee" && logos.length > 0;
  return (
    <Container size="xl">
      {block.caption && (
        <p className="type-label text-ink-3 mb-6 flex items-center gap-3.5">
          <span className="bg-line h-px flex-1" aria-hidden />
          {block.caption}
          <span className="bg-line h-px flex-1" aria-hidden />
        </p>
      )}
      {marquee ? (
        <div className="relative overflow-hidden" style={{ maskImage: LOGO_FADE, WebkitMaskImage: LOGO_FADE }}>
          <div className="animate-marquee flex w-max items-center gap-x-14 sm:gap-x-20">
            {[...logos, ...logos].map((logo, i) => (
              <Image
                key={i}
                src={logo.src}
                alt={i < logos.length ? logo.alt ?? "" : ""}
                aria-hidden={i >= logos.length}
                width={220}
                height={64}
                className="h-8 w-auto flex-none object-contain opacity-80 sm:h-10"
              />
            ))}
          </div>
        </div>
      ) : block.image ? (
        <Image
          src={block.image}
          alt={block.imageAlt ?? "Partner logos"}
          width={1672}
          height={128}
          sizes="(max-width: 1024px) 92vw, 1024px"
          className="mx-auto h-auto w-full max-w-5xl"
        />
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-80">
          {logos.map((logo, i) => (
            <Image key={i} src={logo.src} alt={logo.alt ?? ""} width={200} height={64} className="h-9 w-auto object-contain sm:h-11" />
          ))}
        </div>
      )}
    </Container>
  );
}

// ── pillars ─────────────────────────────────────────────────────────────────

const GRID_COLS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export function PillarsBlock({ block }: { block: z.infer<typeof pillarsBlockSchema> }) {
  return (
    <Container size="xl">
      <BlockHeaderRow header={block.header} />
      {/*
        `border-line-strong`, not `border-line`. On a light paper an elevated
        card is #FFFFFF on a #F7F6F4 ground — a 1% step — so at 12% ink the
        card edge was effectively invisible and three cards read as one loose
        column of text. The stronger hairline is what makes them objects.
      */}
      <div className={clsx("grid gap-5", GRID_COLS[block.columns ?? 3])}>
        {block.items.map((item, i) => {
          const Icon = resolveIcon(item.icon);
          return (
            <Reveal key={i} direction="up" delay={i * 60}>
              <article className="border-line-strong bg-elevated flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border">
                {item.image && (
                  <div className="border-line relative aspect-[16/9] w-full overflow-hidden border-b">
                    <Image
                      src={item.image}
                      alt={item.imageAlt ?? item.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-7 sm:p-8">
                  {/*
                    No 01/02/03 here. Research · Innovation · Public Diplomacy are
                    three parallel domains, not an ordered sequence, and numbering
                    a set that has no order tells the reader something false.
                  */}
                  <div className="mb-6 flex items-center gap-3">
                    {Icon && <Icon size={19} strokeWidth={1.6} className="text-ink-2" aria-hidden />}
                    <span className="bg-line h-px flex-1" aria-hidden />
                  </div>
                  <h3 className="type-display text-ink mb-3.5 text-[1.45rem] leading-tight">{item.title}</h3>
                  <p className="text-ink-2 measure mb-7 text-[15px] leading-[1.7]">{item.body}</p>
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-auto">
                      {item.tagsLabel && <p className="type-label text-ink-3 mb-3">{item.tagsLabel}</p>}
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Container>
  );
}

// ── statement ───────────────────────────────────────────────────────────────

export function StatementBlock({ block }: { block: z.infer<typeof statementBlockSchema> }) {
  return (
    <Container size="xl">
      {/*
        Asymmetric by construction: the statement holds cols 1–7 and its
        supporting prose sits in the marginalia column, so the right half of the
        band carries something. A full-width statement heading with body copy
        underneath left ~600px of empty paper to its right at desktop widths.
      */}
      <div className="grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
        <Reveal direction="up">
          <h2 className="type-display text-ink text-balance leading-[1.14] text-[calc(clamp(1.875rem,3.6vw,2.75rem)*var(--display-scale))]">
            {block.heading}
          </h2>
        </Reveal>
        <div className="lg:pt-2">
          {block.body && (
            <p className="text-ink-2 border-line measure-sm text-[15.5px] leading-[1.75] lg:border-l lg:pl-10">
              {block.body}
            </p>
          )}
          {block.chips && block.chips.length > 0 && (
            <div className={clsx("mt-7 flex flex-wrap gap-2.5", block.body && "lg:ml-10")}>
              {block.chips.map((chip, i) => {
                const Icon = resolveIcon(chip.icon);
                return (
                  <Tag key={i} large>
                    {Icon && <Icon size={15} strokeWidth={1.6} className="text-ink-3" aria-hidden />}
                    {chip.label}
                  </Tag>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {block.image && (
        <div className="mt-12">
          <Plate src={block.image} alt={block.imageAlt ?? ""} maxH="clamp(18rem, 40vw, 30rem)" />
        </div>
      )}
    </Container>
  );
}

// ── stats ───────────────────────────────────────────────────────────────────

/** Fire once when the element scrolls into view (SSR-safe, above-fold aware). */
function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setSeen(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          obs.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [seen]);
  return { ref, seen };
}

/** Ease-out count-up from 0 → target; respects reduced-motion and only runs once armed. */
function useCountUp(target: number, run: boolean, ms = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / ms);
      setVal(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return val;
}

/** Renders a stat figure like "50+", "1M+", "10y", "98%" — counting up the leading integer. */
function StatFigure({ value, run }: { value: string; run: boolean }) {
  const m = value.match(/^(\D*)(\d[\d,]*)(.*)$/);
  const num = m ? parseFloat(m[2].replace(/,/g, "")) : NaN;
  const animate = m != null && Number.isFinite(num) && Number.isInteger(num) && num >= 3;
  const current = useCountUp(animate ? num : 0, run && animate);
  if (!animate) return <>{value}</>;
  return (
    <>
      {m![1]}
      {(run ? Math.round(current) : 0).toLocaleString()}
      {m![3]}
    </>
  );
}

const STAT_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

export function StatsBlock({ block }: { block: z.infer<typeof statsBlockSchema> }) {
  const { ref, seen } = useInViewOnce<HTMLDivElement>();
  const cols = block.columns ?? Math.min(4, Math.max(2, block.items.length));
  return (
    <Container size="xl">
      <BlockHeaderRow header={block.header} />
      <div ref={ref} className={clsx("border-line grid gap-x-8 gap-y-10 border-t", STAT_COLS[cols] ?? STAT_COLS[3])}>
        {block.items.map((item, i) => {
          const Icon = resolveIcon(item.icon);
          return (
            <Reveal key={i} direction="up" delay={i * 70}>
              {/*
                The icon used to sit above the figure at 22px in the accent —
                four gold glyphs competing with the four numerals they were meant
                to introduce. It now runs inline with the label at label size and
                in ink, so it annotates the caption instead of shouting over the
                number, and the accent tick is the only mark above the figure.
              */}
              <div className="pt-6">
                <span className="accent-rule mb-6" aria-hidden />
                <p className="type-display text-ink leading-none tabular-nums text-[calc(clamp(2.5rem,5.4vw,3.75rem)*var(--display-scale))]">
                  <StatFigure value={item.value} run={seen} />
                </p>
                <p className="type-label text-ink-3 mt-4 flex items-center gap-2">
                  {Icon && <Icon size={13} strokeWidth={1.8} aria-hidden />}
                  {item.label}
                </p>
                {item.detail && <p className="text-ink-2 mt-2 text-sm leading-relaxed">{item.detail}</p>}
              </div>
            </Reveal>
          );
        })}
      </div>
    </Container>
  );
}

// ── card grid ───────────────────────────────────────────────────────────────

/** Ruled register row — small plate at native size beside the text. */
function IndexRow({ item }: { item: z.infer<typeof cardGridBlockSchema>["items"][number] }) {
  const body = (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-7">
      {item.image ? (
        <Image
          src={item.image}
          alt={item.imageAlt ?? ""}
          width={340}
          height={260}
          sizes="136px"
          className="border-line aspect-4/3 w-full rounded-[calc(var(--radius-card)*0.6)] border object-cover"
        />
      ) : (
        <span className="border-line aspect-4/3 w-full rounded-[calc(var(--radius-card)*0.6)] border" aria-hidden />
      )}
      <div>
        {item.meta && <p className="type-label text-ink-3 mb-2">{item.meta}</p>}
        <h3 className="type-display text-ink text-[1.2rem] leading-snug">{item.title}</h3>
        {item.body && <p className="text-ink-2 measure mt-2 text-[14.5px] leading-relaxed">{item.body}</p>}
        {item.linkLabel && (
          <span className="type-label text-ink-2 group-hover:text-ink mt-3 inline-flex items-center gap-2">
            {item.linkLabel}
            <ArrowRight size={13} aria-hidden />
          </span>
        )}
      </div>
    </div>
  );
  return item.linkUrl ? (
    <a href={item.linkUrl} className="group block">
      {body}
    </a>
  ) : (
    body
  );
}

export function CardGridBlock({ block }: { block: z.infer<typeof cardGridBlockSchema> }) {
  if ((block.variant ?? "card") === "index") {
    return (
      <Container size="xl">
        <BlockHeaderRow header={block.header} />
        <ul className="border-line grid gap-x-14 border-t sm:grid-cols-2">
          {block.items.map((item, i) => (
            <li key={i} className="border-line border-b py-7">
              <Reveal direction="up" delay={i * 40}>
                <IndexRow item={item} />
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    );
  }
  return (
    <Container size="xl">
      <BlockHeaderRow header={block.header} />
      <div className={clsx("grid gap-5", GRID_COLS[block.columns ?? 3])}>
        {block.items.map((item, i) => {
          const inner = (
            <article className="border-line-strong bg-elevated flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.imageAlt ?? ""}
                  width={720}
                  height={420}
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                  className="aspect-16/9 w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col p-6">
                {item.icon && <Marker icon={item.icon} size="sm" />}
                {item.meta && <p className={clsx("type-label text-ink-3", item.icon ? "mt-4" : "")}>{item.meta}</p>}
                <h3
                  className={clsx(
                    "type-display text-ink text-[1.2rem] leading-snug",
                    (item.icon || item.meta) && "mt-3",
                  )}
                >
                  {item.title}
                </h3>
                {item.body && <p className="text-ink-2 mt-2.5 text-[14.5px] leading-relaxed">{item.body}</p>}
                {item.linkLabel && (
                  <span className="type-label text-ink-2 mt-auto inline-flex items-center gap-2 pt-5">
                    {item.linkLabel}
                    <ArrowRight size={13} aria-hidden />
                  </span>
                )}
              </div>
            </article>
          );
          return (
            <Reveal key={i} direction="up" delay={i * 50}>
              {item.linkUrl ? (
                <a href={item.linkUrl} className="hover:border-ocean block h-full">
                  {inner}
                </a>
              ) : (
                inner
              )}
            </Reveal>
          );
        })}
      </div>
    </Container>
  );
}

// ── icon list ───────────────────────────────────────────────────────────────

export function IconListBlock({ block }: { block: z.infer<typeof iconListBlockSchema> }) {
  const twoUp = (block.columns ?? 2) === 2 && block.items.length > 2;
  const rows = Math.ceil(block.items.length / 2);
  return (
    <Container size="xl">
      <BlockHeaderRow header={block.header} />
      {/*
        Two columns by default so a five- or six-item list forms a block rather
        than a thin ladder down the left edge of an otherwise empty band. This
        block also used `Container size="md"`, which is why its left edge sat
        ~130px inboard of every neighbouring section.
      */}
      {/*
        Column-major flow (`grid-flow-col` with an explicit row count), not the
        default row-major. These lists are often ordered — the home page's is an
        acronym read in sequence — and row-major fill puts items 1,3,5 in the left
        column and 2,4 in the right, so scanning down the left column reads
        B · I · D. Column-major gives B · U · I then L · D, which is the order the
        content actually has.
      */}
      <ul
        className={clsx(
          "grid gap-x-14 gap-y-7",
          twoUp && "md:grid-flow-col md:grid-cols-2 md:grid-rows-[repeat(var(--icon-list-rows),auto)]",
        )}
        style={twoUp ? ({ "--icon-list-rows": rows } as React.CSSProperties) : undefined}
      >
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-4">
            <Marker icon={item.icon} marker={item.marker} />
            <div className="pt-0.5">
              <h3 className="text-ink text-[15.5px] font-semibold leading-snug">{item.title}</h3>
              {item.body && <p className="text-ink-2 measure mt-1.5 text-[14px] leading-[1.6]">{item.body}</p>}
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
}

// ── media + text ────────────────────────────────────────────────────────────

export function MediaTextBlock({ block }: { block: z.infer<typeof mediaTextBlockSchema> }) {
  const sheet = block.images && block.images.length > 0;
  return (
    <Container size="xl">
      <BlockHeaderRow header={block.header} />
      <div className={clsx("grid items-start gap-x-14 gap-y-10", block.image && !sheet && "lg:grid-cols-2")}>
        <div className={clsx(block.flip && !sheet && "lg:order-2")}>
          {block.heading && (
            <h3 className="type-display text-ink mb-4 text-[1.6rem] leading-[1.24]">{block.heading}</h3>
          )}
          <div className="text-ink-2 measure space-y-4 text-[15.5px] leading-[1.75]">
            {block.body.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <BlockButtons buttons={block.buttons} className="mt-8" />
        </div>
        {block.image && !sheet && (
          <div className={clsx("lg:justify-self-end", block.flip && "lg:order-1")}>
            <Plate src={block.image} alt={block.imageAlt ?? ""} />
          </div>
        )}
      </div>
      {sheet && (
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:max-w-3xl">
          {block.images!.map((img, i) => (
            <li key={i}>
              <Image
                src={img.src}
                alt={img.alt ?? ""}
                width={260}
                height={196}
                sizes="(max-width: 640px) 44vw, 240px"
                className="border-line w-full rounded-[calc(var(--radius-card)*0.6)] border object-cover"
              />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

// ── timeline ────────────────────────────────────────────────────────────────

/** Optional arrow-linked progression row (e.g. a university path) shared by both timeline layouts. */
function TimelineFlow({ flow }: { flow: NonNullable<z.infer<typeof timelineBlockSchema>["flow"]> }) {
  if (!flow.length) return null;
  return (
    <div className="mt-10 flex flex-col items-stretch gap-3 md:flex-row md:items-center">
      {flow.map((f, i) => (
        <div key={i} className="contents">
          {i > 0 && (
            <span className="text-ink-3 flex flex-none items-center justify-center rotate-90 py-1 md:rotate-0 md:px-1" aria-hidden>
              <ArrowRight size={16} strokeWidth={1.6} />
            </span>
          )}
          <div className="border-line-strong bg-elevated w-full flex-1 overflow-hidden rounded-[var(--radius-card)] border">
            {f.image && (
              <Image
                src={f.image}
                alt={f.imageAlt ?? ""}
                width={800}
                height={210}
                sizes="(max-width: 768px) 92vw, 30vw"
                className="aspect-16/6 w-full object-cover"
              />
            )}
            <div className="px-5 pb-5 pt-4">
              <h4 className="type-display text-ink text-[1.05rem] leading-snug">{f.title}</h4>
              {f.subtitle && <p className="text-ink-2 mt-1 text-[13.5px]">{f.subtitle}</p>}
              {f.location && <p className="type-label text-ink-3 mt-2">{f.location}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimelineBlock({ block }: { block: z.infer<typeof timelineBlockSchema> }) {
  // Vertical rail: the richer animated primitive (connecting line + numbered dots + cards).
  if (block.layout === "vertical") {
    const items = block.milestones.map((m, i) => ({
      key: String(i),
      title: m.title,
      place: m.location,
      note: m.note ?? m.detail,
      photo: m.image,
    }));
    return (
      <Container size="xl">
        <BlockHeaderRow header={block.header} />
        <Timeline items={items} orientation="vertical" numbered />
        {block.flow && <TimelineFlow flow={block.flow} />}
      </Container>
    );
  }
  return (
    <Container size="xl">
      <BlockHeaderRow header={block.header} />
      {/*
        Three columns, not six. At six the cards were ~90px wide at 1440px, with
        66px-tall letterbox thumbnails cropped from 98×67 sources — nothing in
        them was legible. Chronology is real here, so the ordinal stays; it is
        set in the mono index voice next to the school name, and the thumbnail
        renders at close to its native size instead of being blown up.
      */}
      <ol className="border-line grid gap-x-12 border-t sm:grid-cols-2 lg:grid-cols-3">
        {block.milestones.map((m, i) => (
          <li key={i} className="border-line border-b">
            <details className="group">
              <summary
                className={clsx(
                  "flex cursor-pointer list-none items-start gap-4 py-5 [&::-webkit-details-marker]:hidden",
                  !m.detail && "cursor-default",
                )}
              >
                {m.image ? (
                  <Image
                    src={m.image}
                    alt={m.imageAlt ?? ""}
                    width={196}
                    height={134}
                    sizes="98px"
                    className="border-line mt-0.5 aspect-3/2 w-[4.25rem] flex-none rounded-[calc(var(--radius-card)*0.5)] border object-cover"
                  />
                ) : (
                  <span className="type-label text-ink-3 mt-1 w-[4.25rem] flex-none tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="type-label text-ink-3 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-ink mt-1.5 block text-[15px] font-semibold leading-snug">{m.title}</span>
                  {m.location && <span className="type-record text-ink-3 mt-1 block">{m.location}</span>}
                  {m.note && <span className="text-ink-2 mt-2 block text-[13.5px] leading-[1.55]">{m.note}</span>}
                </span>
                {m.detail && (
                  <ChevronDown
                    size={15}
                    className="text-ink-3 mt-1 flex-none transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                )}
              </summary>
              {m.detail && (
                <p className="text-ink-2 border-line mb-5 ml-[5.25rem] border-l pl-4 text-[13px] leading-[1.65]">
                  {m.detail}
                </p>
              )}
            </details>
          </li>
        ))}
      </ol>
      {block.flow && <TimelineFlow flow={block.flow} />}
    </Container>
  );
}

// ── table ───────────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "type-label rounded-[calc(var(--radius-card)*0.5)] border px-3.5 py-2 transition-colors",
        active ? "bg-ocean text-on-accent border-transparent" : "border-line-strong text-ink-2 hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}

export function TableBlock({ block }: { block: z.infer<typeof tableBlockSchema> }) {
  const [active, setActive] = useState<string | null>(null);
  const fk = block.filterKey;
  const filterVals = fk ? Array.from(new Set(block.rows.map((r) => r[fk]).filter(Boolean))) : [];
  const rows = fk && active ? block.rows.filter((r) => r[fk] === active) : block.rows;
  return (
    <Container size="xl">
      <BlockHeaderRow header={block.header} />
      {fk && filterVals.length > 1 && (
        <div className="mb-7 flex flex-wrap gap-2.5">
          <FilterChip label={block.filterAllLabel ?? "All"} active={active === null} onClick={() => setActive(null)} />
          {filterVals.map((v) => (
            <FilterChip key={v} label={v} active={active === v} onClick={() => setActive(v)} />
          ))}
        </div>
      )}
      <div className="border-line overflow-x-auto rounded-[var(--radius-card)] border">
        <table className="w-full border-collapse text-[14.5px]">
          <thead>
            <tr>
              {block.columns.map((col) => (
                <th key={col.key} className="type-label bg-surface-2 text-ink-3 whitespace-nowrap px-5 py-4 text-left">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={clsx(i > 0 && "border-line border-t")}>
                {block.columns.map((col, ci) => {
                  const value = row[col.key] ?? "";
                  const isLink = block.linkKey === col.key && value;
                  return (
                    <td
                      key={col.key}
                      className={clsx(
                        "px-5 py-5 align-top tabular-nums",
                        ci === 0 ? "text-ink max-w-[340px] font-semibold leading-snug" : "text-ink-2",
                      )}
                    >
                      {isLink ? (
                        <a href={value} className="type-label text-ink-2 hover:text-ink inline-flex items-center gap-1.5 whitespace-nowrap">
                          {block.linkLabel ?? "View"}
                          <ExternalLink size={13} aria-hidden />
                        </a>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}

// ── quote ───────────────────────────────────────────────────────────────────

export function QuoteBlock({ block }: { block: z.infer<typeof quoteBlockSchema> }) {
  return (
    <Container size="xl">
      {/*
        A pull-quote should read as a held moment, not as trim. This used to be
        22–26px centred between two symmetrical accent hairline gradients — the
        same decorative frame the hero tagline had. Now the quote mark is the
        one place gold appears at a size where it can carry, and the quote sits
        on the same left edge as everything else.
      */}
      <figure className="grid gap-x-8 sm:grid-cols-[auto_minmax(0,1fr)]">
        <span
          className="text-ocean-strong type-display hidden text-[4.5rem] leading-[0.72] sm:block"
          aria-hidden
        >
          &ldquo;
        </span>
        <div>
          <blockquote
            className={clsx(
              "text-ink measure-lg",
              block.script
                ? "text-[clamp(1.5rem,2.6vw,2.1rem)] leading-[1.35]"
                : "type-display text-[clamp(1.45rem,2.6vw,2.15rem)] leading-[1.32]",
            )}
            style={block.script ? scriptFont : undefined}
          >
            {block.text}
          </blockquote>
          {block.attribution && <figcaption className="type-label text-ink-3 mt-6">— {block.attribution}</figcaption>}
        </div>
      </figure>
    </Container>
  );
}

// ── cta ─────────────────────────────────────────────────────────────────────

export function CtaBlock({ block }: { block: z.infer<typeof ctaBlockSchema> }) {
  return (
    <Container size="xl">
      <div className="mx-auto max-w-2xl text-center">
        <span className="accent-rule mx-auto mb-8" aria-hidden />
        <h2 className="type-display text-ink text-balance leading-[1.14] text-[calc(clamp(1.75rem,3.4vw,2.625rem)*var(--display-scale))]">
          {block.heading}
        </h2>
        {block.description && (
          <p className="text-ink-2 mx-auto mt-5 max-w-xl text-[17px] leading-relaxed">{block.description}</p>
        )}
        <BlockButtons buttons={block.buttons} className="mt-9 justify-center" />
      </div>
    </Container>
  );
}
