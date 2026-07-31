"use client";

import { ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import clsx from "clsx";
import Container from "./Container";
import Eyebrow from "./Eyebrow";
import { site } from "@/config/site";
import { DARK_WEDGE, DARK_MOBILE, LIGHT_WEDGE, LIGHT_MOBILE } from "@/lib/hero-scrims";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  align?: "left" | "center";
  accent?: "ocean" | "sunset" | "ink";
  className?: string;
  children?: ReactNode;
  /** Optional background photo. When set, the hero becomes photo-forward:
   *  the image fills the section with a legibility scrim and content anchors to
   *  the bottom. The band follows the theme — dark plate + dark scrim + light
   *  type in dark mode, light plate + paper scrim + ink type in light mode. */
  backgroundImage?: string;
  backgroundAlt?: string;
  imagePosition?: string;
  /**
   * Brighter plate for light mode. Without one the same photograph is used in
   * both modes under a paper wash, which is right for an already-bright frame and
   * wrong for a dark studio portrait — see the comment on the light branch below.
   */
  backgroundImageLight?: string;
  imagePositionLight?: string;
  /** Narrow-viewport crops. A crop cannot be shared between plates — at 390px it
   *  decides which object is on screen, not merely how it sits. */
  imagePositionMobile?: string;
  imagePositionMobileLight?: string;
  /** Force the (photo-less) hero onto a dark band. Defaults to the site's
   *  `layout.heroTone` so a whole site opts in once. Ignored for photo heroes
   *  (already dark by construction). */
  tone?: "auto" | "dark";
};

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  meta,
  actions,
  // Left, not centre. A centred hero over a portrait puts the headline on the
  // subject's face whatever the crop, and it fights the single left edge every
  // other section on these pages is aligned to.
  align = "left",
  accent = "ocean",
  className,
  children,
  backgroundImage,
  backgroundAlt = "",
  imagePosition = "center",
  backgroundImageLight,
  imagePositionLight,
  imagePositionMobile,
  imagePositionMobileLight,
  tone,
}: Props) {
  // A photo hero is already dark; the plain hero opts into a dark band via
  // `.section-invert` (so bg-surface/text-ink/text-ocean resolve to the site's
  // dark tokens on an otherwise light page).
  const invert = (tone ?? site.layout?.heroTone) === "dark";
  const haloAccent =
    accent === "sunset"
      ? "color-mix(in srgb, var(--color-sunset) 24%, transparent)"
      : accent === "ink"
        ? "color-mix(in srgb, var(--color-ink) 16%, transparent)"
        : "color-mix(in srgb, var(--color-ocean) 24%, transparent)";

  // Photo-forward hero: image dominates, light text, content at the bottom.
  if (backgroundImage) {
    return (
      /*
        Wrapped in `.section-invert` rather than painted `bg-ink`. `--color-ink`
        is the *text* color: it inverts with the theme, so a "dark" backdrop
        built from it resolved to near-WHITE in dark mode. That was invisible
        only because the photo covers it — a slow connection or a missing file
        put white type on a white ground. Inside `.section-invert` the dark
        palette is in force, so `bg-bg` is genuinely dark in both themes and the
        copy can use the same `text-ink` / `text-ink-2` tokens as everywhere else
        instead of hardcoded white with drop-shadows.
      */
      /*
        `section-invert-auto`, not `section-invert`. Forcing the dark palette here
        meant a light-theme site opened its contact page on a near-black slab with
        a light-ink navbar over it — the same bug composed-page heroes had before
        they gained a light plate, just on the routes nobody re-checked. The auto
        class inverts only in dark mode (see globals.css), so in light mode the
        copy uses the page's own ink tokens over a paper scrim.
      */
      <div className="section-invert-auto">
        <section
          className={clsx(
            "relative flex flex-col overflow-hidden bg-bg",
            /*
             * A photographic band wants height — it is showing something. A paper
             * band does not: at 62svh with no image, light mode opened on ~380px
             * of empty surface above the title, which reads as a loading failure
             * rather than a choice. So the band is tall only where there is a
             * photograph to fill it. The two sets don't overlap at the same
             * variant, so `dark:` wins on specificity rather than source order.
             */
            backgroundImageLight
              ? "min-h-[62svh] sm:min-h-[56vh] lg:min-h-[52vh]"
              : "bg-surface noise-overlay min-h-[34svh] dark:bg-bg dark:min-h-[62svh] sm:min-h-[30vh] dark:sm:min-h-[56vh] lg:min-h-[28vh] dark:lg:min-h-[52vh]",
            className,
          )}
        >
          <div className="absolute inset-0" aria-hidden="true">
            {/*
              The light plate, when one is named. A dark studio portrait under a
              paper wash goes grey — lightening a photo pushes it INTO the values
              ink occupies — so a genuinely bright frame is the only way a light
              hero looks deliberate. Falls back to the single plate for a photo
              that already reads bright in both modes.
            */}
            {backgroundImageLight && (
              <Image
                src={backgroundImageLight}
                alt={backgroundAlt}
                fill
                priority
                sizes="100vw"
                className="object-cover object-[var(--hero-pos-mobile)] sm:object-[var(--hero-pos)] dark:hidden"
                style={
                  {
                    "--hero-pos": imagePositionLight ?? imagePosition,
                    "--hero-pos-mobile":
                      imagePositionMobileLight ?? imagePositionLight ?? imagePositionMobile ?? imagePosition,
                  } as React.CSSProperties
                }
              />
            )}
            {/*
              The dark plate is ALWAYS dark-mode-only, even with no light
              counterpart. With no bright frame to swap in, light mode falls back
              to the paper hero (see `lightIsPlain` on the section) rather than
              showing this photograph under a white wash — a dark studio portrait
              lightened toward paper lands in the same values as the ink and reads
              as neither photograph nor page. A site that wants a photo here in
              light mode names one; a site whose photo is already bright names the
              same file twice.
            */}
            <Image
              src={backgroundImage}
              alt={backgroundAlt}
              fill
              priority
              sizes="100vw"
              className="hidden object-cover object-[var(--hero-pos-mobile)] sm:object-[var(--hero-pos)] dark:block"
              style={
                {
                  "--hero-pos": imagePosition,
                  "--hero-pos-mobile": imagePositionMobile ?? imagePosition,
                } as React.CSSProperties
              }
            />
            {/*
              Left-weighted wedge, not a symmetric bottom fade. An even ramp put a
              headline wherever the subject's face happened to be — on the contact
              page it sat directly on his cheekbone. The copy is bottom-left and
              the scrim is heaviest exactly there. Below `sm` the wedge is
              meaningless (the copy column IS the width), so the ramp runs
              vertically instead. Values shared with composed-page heroes in
              `src/lib/hero-scrims.ts`.
            */}
            {backgroundImageLight && (
              <div className="absolute inset-0 dark:hidden">
                <div className="absolute inset-0 sm:hidden" style={{ background: LIGHT_MOBILE }} />
                <div className="absolute inset-0 max-sm:hidden" style={{ background: LIGHT_WEDGE }} />
              </div>
            )}
            <div className="absolute inset-0 hidden dark:block">
              <div className="absolute inset-0 sm:hidden" style={{ background: DARK_MOBILE }} />
              <div className="absolute inset-0 max-sm:hidden" style={{ background: DARK_WEDGE }} />
            </div>
          </div>

          {/*
            Accent halo. `mix-blend-screen` only lightens, which is right over a
            photograph and does nothing at all over paper — so in light mode it
            blends normally, where it is carrying the band rather than tinting it.
          */}
          <div
            className="pointer-events-none absolute inset-x-0 -top-32 h-[420px] opacity-45 dark:opacity-25 dark:mix-blend-screen"
            aria-hidden="true"
            style={{ background: `radial-gradient(60% 80% at 22% 0%, ${haloAccent}, transparent 70%)` }}
          />

          {/*
            `w-full` is load-bearing. The section is `flex flex-col`, and in a
            column flex container `margin-inline: auto` (which Container sets)
            overrides the default `align-items: stretch` — so the container
            shrank to its content width and then centred itself. The hero read as
            centre-aligned no matter what `align` said.
          */}
          <Container size="xl" className="relative z-10 mt-auto w-full pb-12 pt-32 sm:pb-16 lg:pb-20">
            <motion.div
              className={clsx(
                "flex flex-col gap-4 sm:gap-5",
                align === "center" ? "items-center text-center" : "items-start text-left",
              )}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {eyebrow && (
                <div className={clsx("flex w-full items-center gap-3.5", align === "center" && "max-w-xl")}>
                  <span className="accent-rule" aria-hidden="true" />
                  <span className="type-label text-ink-2">{eyebrow}</span>
                  <span className="bg-line h-px flex-1" aria-hidden="true" />
                </div>
              )}
              <h1 className="type-display text-ink text-balance leading-[1.06] text-[calc(clamp(2.25rem,5vw,3.75rem)*var(--display-scale))] max-w-2xl">
                {title}
              </h1>
              {subtitle && (
                <p
                  className={clsx(
                    "text-ink-2 measure text-pretty text-base leading-relaxed sm:text-lg",
                    align === "center" && "mx-auto",
                  )}
                >
                  {subtitle}
                </p>
              )}
              {meta && (
                <div className={clsx("type-record text-ink-3", align === "center" && "mx-auto")}>{meta}</div>
              )}
              {actions && (
                <div
                  className={clsx(
                    "mt-1 flex flex-wrap gap-3",
                    align === "center" ? "justify-center" : "justify-start",
                  )}
                >
                  {actions}
                </div>
              )}
              {children}
            </motion.div>
          </Container>
        </section>
      </div>
    );
  }

  // No photo: original soft-surface hero with halo behind type.
  return (
    <section
      className={clsx(
        "relative overflow-hidden bg-surface noise-overlay pt-28 sm:pt-32 lg:pt-40 pb-14 sm:pb-20 lg:pb-24",
        invert && "section-invert border-b border-line",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 h-[480px] opacity-50"
        aria-hidden="true"
        style={{
          background: `radial-gradient(60% 80% at 50% 0%, ${haloAccent}, transparent 70%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-line" aria-hidden="true" />

      <Container size="lg" className="relative z-10">
        <motion.div
          className={clsx(
            "flex flex-col gap-5 sm:gap-6",
            align === "center" ? "items-center text-center" : "items-start text-left",
          )}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {eyebrow && <Eyebrow tone={accent === "ink" ? "ink" : "label"}>{eyebrow}</Eyebrow>}
          <h1 className="font-bold tracking-tight text-ink text-balance leading-[1.05] text-[clamp(2.25rem,5.2vw,4.25rem)] max-w-3xl">
            {title}
          </h1>
          {subtitle && (
            <p
              className={clsx(
                "text-ink-2 text-pretty max-w-2xl text-base sm:text-lg leading-relaxed",
                align === "center" && "mx-auto",
              )}
            >
              {subtitle}
            </p>
          )}
          {meta && (
            <div className={clsx("text-sm text-ink-3", align === "center" && "mx-auto")}>{meta}</div>
          )}
          {actions && (
            <div
              className={clsx(
                "flex flex-wrap gap-3 mt-1",
                align === "center" ? "justify-center" : "justify-start",
              )}
            >
              {actions}
            </div>
          )}
          {children}
        </motion.div>
      </Container>
    </section>
  );
}
