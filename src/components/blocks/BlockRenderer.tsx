"use client";

import { useEffect } from "react";
import Image from "next/image";
import clsx from "clsx";
import type { PageBlock, SitePage, TabsBlock, BlockTone, LeafBlock, BlockBackground } from "@tzohar/schema";
import Tabs, { useHashTab } from "@/components/ui/Tabs";
import Container from "@/components/ui/Container";
import {
  DARK_WEDGE,
  DARK_MOBILE,
  DARK_SOFT,
  DARK_VEIL,
  LIGHT_WEDGE,
  LIGHT_MOBILE,
  LIGHT_BAND,
} from "@/lib/hero-scrims";
import type { PostSummary } from "@/data/posts";
import {
  HeroBlock,
  LogoStripBlock,
  PillarsBlock,
  StatementBlock,
  StatsBlock,
  CardGridBlock,
  IconListBlock,
  MediaTextBlock,
  TimelineBlock,
  TableBlock,
  QuoteBlock,
  CtaBlock,
} from "./LeafBlocks";
import MasterDetailBlock from "./MasterDetailBlock";
import GalleryBlock from "./GalleryBlock";
import PostListBlock from "./PostListBlock";
import VideoBlock from "./VideoBlock";
import JourneyBlock from "./JourneyBlock";
import PortfolioBlock from "./PortfolioBlock";
import PeopleBlock from "./PeopleBlock";

/**
 * Renders a composed page (src/data/pages.json) — the engine half of the
 * block system (`@tzohar/schema` content/pages.ts is the contract). Each
 * block sits in a tone envelope: `invert` wraps the engine's
 * `.section-invert` dark-island scope, so a light site can alternate dark
 * bands exactly like the dark-hero layout. `textured` layers the accent
 * grid-vignette (theme-aware — it derives from the accent + ink tokens).
 */

const TONE_BG: Record<BlockTone, string> = {
  base: "bg-bg",
  muted: "bg-surface",
  deep: "bg-surface-2",
  invert: "bg-bg", // token flips inside .section-invert
};

/**
 * Ruled-sheet texture for `textured` bands.
 *
 * This was a 42px square mesh at 4% ink, which at typical viewport widths beat
 * against the pixel grid and read as a rendering artifact laid over the hero
 * photograph rather than as a surface. Vertical rules only, at a wide 104px
 * pitch and ~3% ink, read as a ruled page — which is also the structural idea
 * the rest of this page system runs on. The accent glow is kept but pushed
 * further off-centre and softened so it lights the band rather than tinting it.
 */
function Texture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: [
          "radial-gradient(ellipse 1100px 620px at 82% 4%, color-mix(in oklab, var(--color-ocean) 13%, transparent), transparent 68%)",
          "linear-gradient(90deg, color-mix(in oklab, var(--color-ink) 3%, transparent) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "auto, 104px 100%",
      }}
    />
  );
}

/**
 * The rule that marks a seam between two sections sharing the same tone.
 *
 * Sections used to carry a uniform full pad top and bottom, so two adjacent
 * same-tone blocks (this site's home page has three muted ones in a row) put
 * ~11rem of empty band between paragraphs with nothing to explain the gap —
 * the page read as broken rather than as spacious. Same-tone neighbours now
 * take the tight pad on both sides of the seam and get this container-width
 * hairline instead, so the separation is *stated*. A tone change needs no rule:
 * the change of ground already carries it.
 */
function BandSeam() {
  return (
    <Container size="xl" className="mb-[var(--band-pad-tight)]">
      <div className="bg-line h-px" aria-hidden />
    </Container>
  );
}

/**
 * Legibility scrim painted over a section background image.
 *
 * The `dark` wedge is deliberately steep and long. The previous ramp fell to
 * 58% by the halfway mark, which is not enough to carry white display type over
 * a lit face — on this site's portrait hero the headline ran straight across the
 * subject's eyes and cheek at roughly 2:1. Copy columns are capped near 46% of
 * the band (see HeroBlock), so the wedge holds ~80% opacity across the whole
 * text column and only opens up past it, where the photograph should be read.
 * A short top band is added independently so the navbar stays legible without
 * having to darken the upper third of every photo.
 */
/*
 * The values live in `src/lib/hero-scrims.ts`, shared with the core-route hero
 * (`ui/PageHero`). They had already been wrong twice, in two components, for the
 * same underlying reason — so there is one contrast budget now, not two copies.
 */
function scrimFor(overlay: BlockBackground["overlay"], tone: BlockTone): string | null {
  switch (overlay ?? "auto") {
    case "none":
      return null;
    case "dark":
      return DARK_WEDGE;
    case "light":
      return LIGHT_BAND;
    case "soft":
      return DARK_SOFT;
    case "veil":
      return DARK_VEIL;
    case "auto":
    default:
      return tone === "invert" ? DARK_WEDGE : LIGHT_BAND;
  }
}

/** Resolve the scrim pair for one plate, so each plate gets its own wedge. */
function scrimPair(overlay: BlockBackground["overlay"], tone: BlockTone, light: boolean) {
  if (overlay === "none") return null;
  if (light && (overlay === "light" || overlay === undefined || overlay === "auto")) {
    return { wide: LIGHT_WEDGE, mobile: LIGHT_MOBILE };
  }
  const wide = scrimFor(overlay, tone);
  return wide ? { wide, mobile: DARK_MOBILE } : null;
}

function Plate({
  src,
  position,
  positionMobile,
  scrim,
  className,
}: {
  src: string;
  position?: string;
  positionMobile?: string;
  scrim: { wide: string; mobile: string } | null;
  className?: string;
}) {
  return (
    <div className={clsx("absolute inset-0", className)}>
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-[var(--bg-pos-mobile)] sm:object-[var(--bg-pos)]"
        style={
          {
            "--bg-pos": position ?? "center",
            "--bg-pos-mobile": positionMobile ?? position ?? "center",
          } as React.CSSProperties
        }
      />
      {scrim && (
        <>
          <div className="absolute inset-0 sm:hidden" style={{ background: scrim.mobile }} />
          <div className="absolute inset-0 max-sm:hidden" style={{ background: scrim.wide }} />
        </>
      )}
    </div>
  );
}

/**
 * Full-bleed photographic background for a whole section, behind its content.
 *
 * When the block names an `imageLight`, BOTH plates are rendered and swapped by
 * the `dark:` variant — which this project scopes to `.dark` *and*
 * `.section-invert`, so an inverted band correctly keeps the dark plate whatever
 * the root mode is. Doing the swap in CSS rather than from a theme hook keeps
 * this a server component and means the first paint is already correct.
 */
function SectionBackground({ bg, tone }: { bg: BlockBackground; tone: BlockTone }) {
  const darkPlate = (
    <Plate
      src={bg.image}
      position={bg.position}
      positionMobile={bg.positionMobile}
      scrim={scrimPair(bg.overlay, tone, false)}
      className={bg.imageLight ? "hidden dark:block" : undefined}
    />
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {bg.imageLight && (
        <Plate
          src={bg.imageLight}
          position={bg.positionLight ?? bg.position}
          /*
           * Never fall straight through to `positionMobile`: that value was chosen
           * for the DARK plate, and the two plates are different photographs. Prefer
           * this plate's own mobile crop, then its own wide crop, and only then the
           * shared one — which is correct when both plates are the same file.
           */
          positionMobile={bg.positionMobileLight ?? bg.positionLight ?? bg.positionMobile}
          scrim={scrimPair(bg.overlayLight ?? "light", tone, true)}
          className="dark:hidden"
        />
      )}
      {darkPlate}
    </div>
  );
}

/**
 * Server-supplied data a block can't get for itself.
 *
 * This whole tree is a client component, so a `postList` block cannot import the
 * posts store without shipping `posts.json` — draft bodies included — to the
 * browser. The server trims to summaries once and passes them in.
 */
export type BlockData = {
  posts?: PostSummary[];
  postCategories?: { key: string; label: string }[];
};

function LeafBlockBody({ block, data }: { block: LeafBlock; data?: BlockData }) {
  switch (block.type) {
    case "postList":
      return <PostListBlock block={block} posts={data?.posts ?? []} categories={data?.postCategories ?? []} />;
    case "hero":
      return <HeroBlock block={block} />;
    case "logoStrip":
      return <LogoStripBlock block={block} />;
    case "pillars":
      return <PillarsBlock block={block} />;
    case "statement":
      return <StatementBlock block={block} />;
    case "stats":
      return <StatsBlock block={block} />;
    case "cardGrid":
      return <CardGridBlock block={block} />;
    case "iconList":
      return <IconListBlock block={block} />;
    case "mediaText":
      return <MediaTextBlock block={block} />;
    case "timeline":
      return <TimelineBlock block={block} />;
    case "masterDetail":
      return <MasterDetailBlock block={block} />;
    case "gallery":
      return <GalleryBlock block={block} />;
    case "video":
      return <VideoBlock block={block} />;
    case "journey":
      return <JourneyBlock block={block} />;
    case "portfolio":
      return <PortfolioBlock block={block} />;
    case "people":
      return <PeopleBlock block={block} />;
    case "table":
      return <TableBlock block={block} />;
    case "quote":
      return <QuoteBlock block={block} />;
    case "cta":
      return <CtaBlock block={block} />;
  }
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * Each tab gets a hash of `<section-id>--<slug(label)>` so a nav dropdown
 * child (`/<page>#<id>--<slug>`) can deep-link straight to a specific tab —
 * not just scroll to the block and land on whichever tab renders first.
 * Native anchor-scroll has no element with that compound id to jump to, so
 * we scroll the section into view ourselves once on mount.
 */
function TabsBlockBody({ block, data }: { block: TabsBlock; data?: BlockData }) {
  const sectionId = block.id ?? "tabs";
  const items = block.items.map((t, i) => ({ key: slugify(t.label) || String(i), label: t.label }));
  const hashKeys = items.map((it) => `${sectionId}--${it.key}`);
  const [activeHash, setActiveHash] = useHashTab(hashKeys, hashKeys[0] ?? "");
  const active = activeHash.slice(sectionId.length + 2);

  useEffect(() => {
    if (window.location.hash.replace("#", "") === activeHash) {
      document.getElementById(sectionId)?.scrollIntoView({ block: "start" });
    }
    // Only on mount — this seeds the initial deep link; later tab clicks
    // shouldn't re-trigger a scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container size="xl">
      <Tabs items={items} activeKey={active} onChange={(key) => setActiveHash(`${sectionId}--${key}`)}>
        {(key) => {
          const tab = block.items.find((t, i) => (slugify(t.label) || String(i)) === key);
          return (
            <div className="space-y-14">
              {(tab?.blocks ?? []).map((b, i) => (
                <LeafBlockBody key={i} block={b} data={data} />
              ))}
            </div>
          );
        }}
      </Tabs>
    </Container>
  );
}

function BlockShell({
  block,
  first,
  continuesBand,
  continuedBelow,
  data,
}: {
  block: PageBlock;
  first: boolean;
  data?: BlockData;
  /** Previous section shares this tone — take the tight pad and mark the seam. */
  continuesBand: boolean;
  /** Next section shares this tone — take the tight pad at the bottom too. */
  continuedBelow: boolean;
}) {
  const tone: BlockTone = block.tone ?? "base";
  const invert = tone === "invert";
  const isHero = block.type === "hero";
  const hasBg = !!block.background;
  const body = block.type === "tabs" ? <TabsBlockBody block={block} data={data} /> : <LeafBlockBody block={block} data={data} />;
  const heroBleed = isHero && hasBg;

  const section = (
    <section
      id={block.id}
      className={clsx(
        "relative scroll-mt-20",
        // Only clip where something is actually painted outside the content box.
        // A blanket `overflow-hidden` also clipped focus rings on the first and
        // last focusable element of every section.
        (hasBg || block.textured) && "overflow-hidden",
        TONE_BG[tone],
        // `flex-col` + `mt-auto` on the body, NOT `items-end`. With
        // `align-items: flex-end` a copy block taller than the band's content box
        // overflows past `padding-top` instead of being held by it, so a hero
        // with a record row and a signature line pushed its eyebrow up under the
        // fixed navbar. `mt-auto` collapses to zero once the content fills the
        // space, which is exactly the behaviour wanted.
        /*
         * Mobile is deliberately shorter and tighter than it was. 82svh with the
         * fact row hidden left the band mostly empty and pushed the credibility
         * strip below the fold; `pb-14` then added 56px before it. Desktop keeps
         * its full-height cinematic band.
         */
        heroBleed
          ? "flex min-h-[74svh] flex-col pb-8 pt-24 sm:min-h-[84vh] sm:pb-18 sm:pt-32"
          : "band",
        !heroBleed && continuesBand && "band-top-tight",
        !heroBleed && continuedBelow && "band-bottom-tight",
        // A real class, not `pt-32` — see the cascade note on `.band`.
        !heroBleed && isHero && first && "band-top-hero",
        // A marquee of logos needs far less air than a band of prose.
        block.type === "logoStrip" && "!py-6 sm:!py-9",
      )}
    >
      {block.background && <SectionBackground bg={block.background} tone={tone} />}
      {/* Never both. Ruled lines drawn over a photograph read as a rendering
          artifact laid on top of the image, not as a surface — the photo is
          already the band's texture. */}
      {block.textured && !hasBg && <Texture />}
      <div className={clsx("relative w-full", heroBleed && "mt-auto")}>
        {continuesBand && <BandSeam />}
        {body}
      </div>
    </section>
  );

  return invert ? <div className="section-invert">{section}</div> : section;
}

export function PageBlocks({ blocks, data }: { blocks: PageBlock[]; data?: BlockData }) {
  const toneOf = (b: PageBlock | undefined): BlockTone | null => (b ? (b.tone ?? "base") : null);
  return (
    <>
      {blocks.map((block, i) => {
        const tone = toneOf(block);
        // A hero always opens its own band, and a full-bleed hero sets its own
        // rhythm entirely, so neither participates in seam collapsing.
        const isHero = block.type === "hero";
        const prevIsHero = blocks[i - 1]?.type === "hero";
        return (
          <BlockShell
            key={block.id ?? i}
            block={block}
            first={i === 0}
            continuesBand={!isHero && !prevIsHero && toneOf(blocks[i - 1]) === tone}
            continuedBelow={!isHero && blocks[i + 1]?.type !== "hero" && toneOf(blocks[i + 1]) === tone}
            data={data}
          />
        );
      })}
    </>
  );
}

export default function ComposedPage({ page, data }: { page: SitePage; data?: BlockData }) {
  return (
    <main>
      <PageBlocks blocks={page.blocks} data={data} />
    </main>
  );
}
