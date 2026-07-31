"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { site, hasModule, type SiteModule } from "@/config/site";
import { routedPages } from "@/data/pages";
import { socialIconMap } from "./ui/SocialIcons";
import { useFormSubmit } from "@/lib/useFormSubmit";
import LegalConsent from "./LegalConsent";

// All in-site routes the footer links to (incl. hash anchors at runtime).
type FooterHref =
  | "/" | "/music" | "/ai" | "/macro-influencer" | "/label" | "/tour" | "/merch"
  | "/press" | "/join" | "/vault" | "/gallery" | "/about" | "/contact" | "/links";

// Umbrella legal docs live on the accounts hub; privacy is served per-site.
const HUB = (process.env.NEXT_PUBLIC_ACCOUNTS_URL || "https://accounts.ebenworks.co").replace(/\/+$/, "");

/** Composed pages that appear in the top nav, mirrored into the footer sitemap. */
const navPages = routedPages.filter((p) => p.nav);

export default function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const tn = useTranslations("nav");
  const tp = useTranslations("plans");
  const tl = useTranslations("legal");
  const [email, setEmail] = useState("");
  const { loading, success, error, submitForm, reset } = useFormSubmit("/api/newsletter");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await submitForm({ email });
    if (!error) setEmail("");
  };

  // Expanded, categorised sitemap — mirrors the top-nav pillars, filtered by the
  // site's enabled modules (items + empty columns are dropped automatically).
  //
  // Labels are stored as thunks, not resolved strings: a disabled module's
  // message namespace isn't shipped to the client at all (see filterMessages
  // in @/lib/messages), so resolving every label up-front would ask next-intl
  // for keys that legitimately don't exist on this build. Resolution happens
  // after the module filter, so only surviving entries are ever looked up.
  const rawColumns: {
    heading: () => string;
    module?: SiteModule;
    items: { label: () => string; href: string; module?: SiteModule }[];
  }[] = [
    {
      heading: () => tn("music"),
      module: "music",
      items: [
        { label: () => tn("musicOverview"), href: "/music" },
        { label: () => tn("discography"), href: "/music#discography" },
        { label: () => tn("topTracks"), href: "/music#top-tracks" },
        { label: () => t("tourDates"), href: "/tour", module: "tour" },
        { label: () => tn("merch"), href: "/merch", module: "merch" },
        { label: () => tn("recordLabel"), href: "/label", module: "label" },
      ],
    },
    {
      heading: () => tn("aiEngineering"),
      module: "ai",
      items: [
        { label: () => tn("overview"), href: "/ai" },
        { label: () => tn("publications"), href: "/ai#publications" },
        { label: () => tn("projects"), href: "/ai#projects" },
        { label: () => tn("experience"), href: "/ai#experience" },
      ],
    },
    {
      heading: () => tn("macroInfluencer"),
      module: "influencer",
      items: [
        { label: () => tn("overview"), href: "/macro-influencer" },
        { label: () => tn("brandPartnerships"), href: "/macro-influencer#partnerships" },
        { label: () => tn("governmentRoles"), href: "/macro-influencer#government" },
        { label: () => tn("press"), href: "/press", module: "press" },
      ],
    },
    {
      heading: () => tp("eyebrow"),
      module: "membership",
      items: [
        { label: () => tn("plans"), href: "/join" },
        { label: () => tn("vault"), href: "/vault", module: "vault" },
        { label: () => tn("gallery"), href: "/gallery", module: "gallery" },
      ],
    },
    {
      heading: () => t("more"),
      items: [
        { label: () => tn("about"), href: "/about" },
        { label: () => tn("contact"), href: "/contact" },
        { label: () => tn("links"), href: "/links", module: "links" },
      ],
    },
  ];
  const columns = rawColumns
    .filter((c) => !c.module || hasModule(c.module))
    .map((c) => ({
      heading: c.heading(),
      items: c.items
        .filter((i) => !i.module || hasModule(i.module))
        .map((i) => ({ label: i.label(), href: i.href })),
    }))
    .filter((c) => c.items.length > 0);

  // Composed pages (`pages` module) carry literal nav labels rather than i18n
  // keys, so they can't live in `rawColumns`. Without this a site built entirely
  // out of composed pages — the common shape for a bespoke build — had a footer
  // sitemap listing only About and Contact while the real sections were absent.
  const pageColumn =
    hasModule("pages") && navPages.length > 0
      ? { heading: t("sections"), items: navPages.map((p) => ({ label: p.nav!.label, href: `/${p.slug}` })) }
      : null;
  const sitemap = pageColumn ? [pageColumn, ...columns] : columns;

  return (
    /* No top margin. `mt-16` painted 4rem of page background between the last
       section and the footer — which on a page closing with a dark CTA band read
       as an unexplained pale stripe across the bottom of the design. The footer
       is a band like any other; its own tone change is the separation. */
    <footer className="relative bg-surface-2 text-ink border-t border-line">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 pt-16 pb-10">
        {/* Brand + newsletter */}
        <div className="grid gap-10 md:grid-cols-2 pb-12 border-b border-line">
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image src={site.brand.logoLight} alt={site.name} width={228} height={96} className="h-10 w-auto dark:hidden" />
              <Image src={site.brand.logoDark} alt={site.name} width={233} height={96} className="h-10 w-auto hidden dark:block" />
            </Link>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-2">{t("tagline")}</p>
            <ul className="mt-6 flex flex-wrap gap-1.5">
              {site.socials.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-elevated/60 text-ink-2 hover:text-ink hover:bg-elevated transition-colors border border-line"
                  >
                    {socialIconMap[s.name] ?? <span className="h-2 w-2 rounded-full bg-current" />}
                  </a>
                </li>
              ))}
            </ul>
            {/*
              A "Connect" heading over a hardcoded Spotify/Apple/SoundCloud
              lookup used to live here. It rendered its heading unconditionally,
              so any site without those exact socials — this one has none at all —
              showed a bare label with nothing under it, and the platform names
              were reference-build specifics sitting in the engine. The icon row
              above already lists every configured social, generically.
            */}
          </div>

          <div className="md:max-w-sm md:justify-self-end w-full">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3 mb-4">{t("newsletter")}</h3>
            <p className="mb-4 text-[15px] text-ink-2 leading-relaxed">{t("newsletterDesc")}</p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <label htmlFor="footer-email" className="sr-only">Email</label>
              <input
                id="footer-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) reset(); }}
                placeholder="you@example.com"
                required
                className="h-11 rounded-full bg-elevated/70 border border-line px-4 text-[14px] text-ink placeholder:text-ink-3 outline-none focus:border-ocean focus:ring-1 focus:ring-ocean transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-11 rounded-full bg-ink text-bg text-[14px] font-semibold disabled:opacity-50 hover:bg-ink-2 transition-colors inline-flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {success ? tc("subscribed") : tc("subscribe")}
              </button>
            </form>
            {error && (
              <p className="mt-2 text-[12px] text-red-500">
                {error}{" "}
                <button type="button" onClick={reset} className="underline">{tc("tryAgain")}</button>
              </p>
            )}
            <LegalConsent className="mt-3 text-[12px] leading-relaxed text-ink-3" />
          </div>
        </div>

        {/* Categorised sitemap */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 pt-12">
          {sitemap.map((col) => (
            <div key={col.heading}>
              <h3 className="type-label text-ink-3 mb-4">{col.heading}</h3>
              <ul className="space-y-2.5">
                {col.items.map((it) => (
                  <li key={it.href}>
                    <Link href={it.href as FooterHref} className="text-[15px] text-ink-2 hover:text-ink transition-colors">
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line">
        {/*
          No `safe-bottom` here any more: it sets `padding-bottom` outright, so it
          silently zeroed this row's `py-5` bottom half. The credit row below is
          the last thing in the document and owns the inset now.
        */}
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-ink-3 text-center sm:text-left">
            © {new Date().getFullYear()} {site.legalName ?? site.name}. {tc("allRightsReserved")}
          </p>
          <nav aria-label="Legal" className="flex items-center justify-center gap-4 text-[12px]">
            <Link href="/privacy" className="text-ink-3 hover:text-ink transition-colors">{tl("privacy")}</Link>
            {hasModule("membership") && (
              <>
                <a href={`${HUB}/terms`} target="_blank" rel="noopener noreferrer" className="text-ink-3 hover:text-ink transition-colors">{tl("terms")}</a>
                <a href={`${HUB}/refunds`} target="_blank" rel="noopener noreferrer" className="text-ink-3 hover:text-ink transition-colors">{tl("refunds")}</a>
              </>
            )}
          </nav>
          {/*
            Where they WORK, not where they are from. `location.from` is a
            biographical fact — it belongs on the about page and in the
            schema.org Person (it still feeds both), but in a footer it reads as
            an address, and a birthplace is not one. The config value is
            untouched; only this line stopped printing it.
          */}
          <p className="text-[12px] text-ink-3 text-center sm:text-right">{[site.location?.based, "Worldwide"].filter(Boolean).join(" · ")}</p>
        </div>
      </div>

      {/*
        Build credit.
        Deliberately NOT a translated string: these are three brand names plus
        four words, and `messages/<locale>.json` is client-owned content that real
        builds trim — next-intl throws on a missing key, so a new key here would
        take down every existing client's every page until their messages file was
        edited. See the contact page's `t.has()` filter for the same hazard.
      */}
      {/*
        The bottom padding clears the mobile bottom nav (fixed, `h-16`,
        `lg:hidden`). The footer never reserved room for it, so whatever row
        happened to be last sat under the bar — measured at full scroll, this
        line's baseline landed 1px past the bar's top edge.
        It is written as one `calc` rather than `pb-20 safe-bottom`, because
        `.safe-bottom` sets `padding-bottom` and therefore REPLACES a Tailwind
        `pb-*` instead of adding to it — that is why the first attempt here
        computed to 0px. Both the bar and the iOS inset have to be in one value.
      */}
      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <p className="text-[11px] text-ink-3/80 text-center tracking-wide">
            A{" "}
            <a
              href="https://tzohar-sites.ebenworks.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-3 hover:text-ink underline decoration-line underline-offset-2 transition-colors"
            >
              Tzohar
            </a>{" "}
            site — built by{" "}
            <a
              href="https://ebenworks.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-3 hover:text-ink underline decoration-line underline-offset-2 transition-colors"
            >
              Ebenworks
            </a>{" "}
            &amp; Statotech.
          </p>
        </div>
      </div>
    </footer>
  );
}
