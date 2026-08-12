"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { Menu, X, ChevronDown, Sun, Moon, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useTheme } from "./ThemeProvider";
import LanguageSwitcher, { MobileLanguageSwitcher } from "./LanguageSwitcher";
import SessionInfoButton from "./SessionInfoButton";
import { socialIconMap } from "./ui/SocialIcons";
import { site, hasModule } from "@/config/site";
import { navEntries, type NavEntry, type NavLeaf } from "@/config/navigation";
import { routing } from "@/i18n/routing";
import { resolveIcon } from "@/lib/icons";

const hasMembership = hasModule("membership");
const hasMultipleLocales = routing.locales.length > 1;

// Navigation IA + module filtering live in src/config/navigation.ts.

/**
 * `site.cta` — the one filled control in the bar, when a site names one.
 *
 * With a CTA, Contact steps down to a plain link: Contact is a destination,
 * while the CTA is the thing the site is asking for, and a filled pill reading
 * "Contact" spent the bar's only emphasis on the weaker of the two. Without
 * one, the header is exactly as it was.
 *
 * The label is literal client copy rather than an i18n key — see the schema for
 * why a new `messages` key is not an option — so the Contact fallback is what a
 * multi-locale site should keep using.
 */
const cta = site.cta;

/** next-intl's typed Link wants a known route; composed pages are data-driven. */
type Href = Parameters<typeof Link>[0]["href"];

export default function Navbar() {
  const { theme, toggleTheme, locked: themeLocked } = useTheme();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  // Composed pages (src/data/pages.json) carry literal labels, not i18n keys —
  // navigation.ts marks them with a leading "@" so they render verbatim.
  const navText = (key: string) => (key.startsWith("@") ? key.slice(1) : t(key));

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const leaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /*
   * TRANSPARENT-OVER-HERO, IN BOTH MODES.
   *
   * This used to be gated on `site.layout.heroTone === "dark"`, which also
   * wrapped the bar in `.section-invert` — forcing white-on-transparent chrome.
   * That is correct over an always-dark hero, but heroes now carry a light plate
   * as well (see `background.imageLight`), so in light mode the bar was rendering
   * white type over a bright photograph and the logo disappeared entirely.
   *
   * Split into two independent things: `overHero` decides whether the bar is
   * transparent (both modes — the hero scrim ramps toward the mode's own paper,
   * so ordinary ink tokens read correctly against it), and `forceDark` is the
   * separate opt-in for a hero band that is dark regardless of mode.
   */
  const configHeroDark = site.layout?.heroTone === "dark";
  const [overHero, setOverHero] = useState(true);
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  /**
   * Is the band under the header dark in BOTH modes? Read from what is rendered,
   * not from config.
   *
   * `layout.heroTone: "dark"` is an art-direction switch an operator sets by
   * hand, and a composed page whose first block carries `tone: "invert"` is a
   * dark band whether or not anyone remembered to. On the demo build nobody had:
   * in light mode the header sat transparent over a near-black hero with its
   * dark-ink logo, which disappeared, and its light-mode nav ink on top of it.
   *
   * The renderer wraps an inverted section in `.section-invert`, so the first
   * child of <main> answers the question exactly. `.section-invert-auto` (core
   * routes with a photo hero) is deliberately NOT matched — that band is dark
   * only in dark mode, where `.dark` already handles the chrome.
   */
  const [heroBandDark, setHeroBandDark] = useState(false);
  useEffect(() => {
    const first = document.querySelector("main")?.firstElementChild;
    setHeroBandDark(!!first?.classList.contains("section-invert"));
  }, [pathname]);
  const forceDark = configHeroDark || heroBandDark;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
      setOverHero(window.scrollY < window.innerHeight * 0.6);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const transparent = overHero && !mobileOpen && !openDropdown;
  const onDark = forceDark && transparent;

  /*
   * SCROLL-SPY over in-page anchors.
   *
   * Most dropdown children on this site are anchors into one long page
   * (`/research-page#publications`), so `pathname` alone marks every child of a
   * group as current at once and the bar can't say where you actually are. This
   * watches the sections those anchors point at and tracks the topmost one that
   * has passed under the header.
   */
  const anchorsOnThisPage = useMemo(() => {
    const ids: string[] = [];
    for (const entry of navEntries) {
      if (entry.kind !== "group") continue;
      for (const child of entry.children) {
        const [path, hash] = child.href.split("#");
        if (hash && path === pathname) ids.push(hash);
      }
    }
    return ids;
  }, [pathname]);

  useEffect(() => {
    /*
     * A tabs block's children are `<id>--<tab-slug>` compound hashes with no
     * element of their own, so fall back to the section id before the "--".
     */
    const targets = anchorsOnThisPage
      .map((id) => ({ id, el: document.getElementById(id) ?? document.getElementById(id.split("--")[0]) }))
      .filter((t): t is { id: string; el: HTMLElement } => !!t.el);

    // Every state write lives in here, including the "no anchors on this page"
    // reset — a bare setState in the effect body is both a lint error and a
    // needless extra render pass on every navigation.
    const onScroll = () => {
      if (targets.length === 0) {
        setActiveAnchor(null);
        return;
      }
      const line = 120; // just below the 64px bar, so a section counts once its head clears it
      let current: string | null = null;
      for (const { id, el } of targets) {
        if (el.getBoundingClientRect().top <= line) current = id;
      }
      setActiveAnchor(current);
    };
    onScroll();
    if (targets.length === 0) return;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [anchorsOnThisPage]);

  const isCurrent = (href: string) => {
    const [path, hash] = href.split("#");
    if (hash) return path === pathname && activeAnchor === hash;
    return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
  };
  /** A group is current when this page is one of its destinations. */
  const groupCurrent = (entry: NavEntry) =>
    entry.kind === "group" && entry.children.some((c) => c.href.split("#")[0] === pathname);

  useEffect(() => () => {
    if (leaveTimeout.current) clearTimeout(leaveTimeout.current);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (mobileOpen) setMobileOpen(false);
        if (openDropdown) setOpenDropdown(null);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, openDropdown]);

  // A click anywhere outside an open panel dismisses it — a hover-only close
  // leaves the panel stranded for keyboard and touch users.
  useEffect(() => {
    if (!openDropdown) return;
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openDropdown]);

  const handleMouseEnter = useCallback((label: string) => {
    if (leaveTimeout.current) {
      clearTimeout(leaveTimeout.current);
      leaveTimeout.current = null;
    }
    setOpenDropdown(label);
  }, []);

  const handleMouseLeave = useCallback(() => {
    leaveTimeout.current = setTimeout(() => setOpenDropdown(null), 160);
  }, []);

  /** Roving arrow-key focus inside an open panel. */
  const onPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLAnchorElement>("a[data-menuitem]") ?? []);
    if (items.length === 0) return;
    e.preventDefault();
    const at = items.indexOf(document.activeElement as HTMLAnchorElement);
    const next =
      e.key === "Home" ? 0
      : e.key === "End" ? items.length - 1
      : e.key === "ArrowDown" ? (at + 1) % items.length
      : (at - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  const renderDesktop = (entry: NavEntry) => {
    if (entry.kind === "group") {
      const open = openDropdown === entry.labelKey;
      const current = groupCurrent(entry);
      return (
        <li
          key={entry.labelKey}
          className="relative"
          onMouseEnter={() => handleMouseEnter(entry.labelKey)}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-[14px] font-medium transition-colors ${
              current || open ? "text-ink" : "text-ink-2 hover:text-ink"
            }`}
            aria-current={current ? "page" : undefined}
            aria-expanded={open}
            aria-haspopup="true"
            onClick={() => setOpenDropdown(open ? null : entry.labelKey)}
          >
            {navText(entry.labelKey)}
            {current && <span className="bg-ocean absolute inset-x-3 bottom-0.5 h-0.5" aria-hidden />}
            <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 pt-2.5"
                onKeyDown={onPanelKeyDown}
              >
                <MenuPanel entry={entry} navText={navText} isCurrent={isCurrent} onNavigate={() => setOpenDropdown(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </li>
      );
    }

    const current = isCurrent(entry.href);
    return (
      <li key={entry.href}>
        <Link
          href={entry.href as Href}
          aria-current={current ? "page" : undefined}
          className={`relative inline-block px-3 py-2 text-[14px] font-medium transition-colors ${
            current ? "text-ink" : "text-ink-2 hover:text-ink"
          }`}
        >
          {navText(entry.nameKey)}
          {/* Gold rule, not gold text: the accent is only legible as a mark at
              this size, not as 14px type. */}
          {current && <span className="bg-ocean absolute inset-x-3 bottom-0.5 h-0.5" aria-hidden />}
        </Link>
      </li>
    );
  };

  const renderMobile = (entry: NavEntry, index: number) => {
    if (entry.kind === "group") {
      const isOpen = mobileAccordion === entry.labelKey;
      const GroupIcon = resolveIcon(entry.icon);
      return (
        <motion.li
          key={entry.labelKey}
          className="border-line border-b"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
        >
          <button
            type="button"
            onClick={() => setMobileAccordion((p) => (p === entry.labelKey ? null : entry.labelKey))}
            className="text-ink flex w-full items-center justify-between gap-3 py-4 text-left text-xl font-semibold"
            aria-expanded={isOpen}
          >
            <span className="flex items-center gap-3">
              {GroupIcon && <GroupIcon size={19} strokeWidth={1.6} className="text-ink-3" aria-hidden />}
              {navText(entry.labelKey)}
            </span>
            <ChevronDown size={20} className={`flex-none transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {isOpen && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {entry.children.map((child) => {
                  const ChildIcon = resolveIcon(child.icon);
                  return (
                    <li key={child.href}>
                      <Link
                        href={child.href as Href}
                        onClick={() => setMobileOpen(false)}
                        className="hover:text-ink flex items-start gap-3 py-3 pl-1"
                      >
                        {ChildIcon ? (
                          <ChildIcon size={17} strokeWidth={1.6} className="text-ink-3 mt-0.5 flex-none" aria-hidden />
                        ) : (
                          <span className="bg-ink-3 mt-2.5 h-1 w-1 flex-none rounded-full" aria-hidden />
                        )}
                        <span>
                          <span className="text-ink-2 block text-base font-medium">{navText(child.nameKey)}</span>
                          {child.description && (
                            <span className="text-ink-3 mt-0.5 block text-[13px] leading-snug">{child.description}</span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
                <li className="h-3" />
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.li>
      );
    }

    const EntryIcon = resolveIcon(entry.icon);
    return (
      <motion.li
        key={entry.href}
        className="border-line border-b"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
      >
        <Link
          href={entry.href as Href}
          onClick={() => setMobileOpen(false)}
          aria-current={isCurrent(entry.href) ? "page" : undefined}
          className={`flex items-center gap-3 py-4 text-xl font-semibold ${
            isCurrent(entry.href) ? "text-ink" : "text-ink-2"
          }`}
        >
          {EntryIcon ? (
            <EntryIcon size={19} strokeWidth={1.6} className="text-ink-3" aria-hidden />
          ) : (
            isCurrent(entry.href) && <span className="bg-ocean h-0.5 w-4 flex-none" aria-hidden />
          )}
          {navText(entry.nameKey)}
        </Link>
      </motion.li>
    );
  };

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-[background-color,box-shadow,border-color] duration-200 ${
          onDark
            ? "section-invert bg-transparent border-b border-transparent"
            : transparent
              ? "bg-transparent border-b border-transparent"
              : scrolled || mobileOpen || openDropdown
                ? "bg-bg/88 backdrop-blur-xl border-b border-line shadow-[0_1px_0_0_var(--color-line)]"
                : "bg-bg/60 backdrop-blur-md border-b border-transparent"
        }`}
      >
        <nav aria-label="Primary" className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 h-16">
          {/* Logo — horizontal lockup (mark + signature wordmark) */}
          <Link href="/" className="flex shrink-0 items-center" aria-label={`${site.name} — home`}>
            <Image
              src={site.brand.logoLight}
              alt={site.name}
              width={228}
              height={96}
              className="h-8 w-auto dark:hidden"
              priority
            />
            <Image
              src={site.brand.logoDark}
              alt={site.name}
              width={233}
              height={96}
              className="hidden h-8 w-auto dark:block"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <ul className="hidden items-center gap-0.5 lg:flex">{navEntries.map(renderDesktop)}</ul>

          {/* Right cluster.
              Social icons live in the footer and the mobile drawer, not here.
              The header's job is the sections plus one call to action; a social
              glyph beside that CTA is an exit link competing with it. */}
          <div className="flex items-center gap-1">
            {hasMultipleLocales && <LanguageSwitcher scrolled={true} />}
            {/* A site that pins `appearance.mode` has committed to one palette,
                so offering a toggle only invites visitors out of its own
                identity — and the provider now ignores the stored value there,
                which would make the control look broken. */}
            {!themeLocked && (
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? tc("switchToLight") : tc("switchToDark")}
                className="border-line text-ink-2 hover:text-ink hover:bg-surface inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
            <Link
              href="/contact"
              className={
                cta
                  ? "text-ink-2 hover:text-ink ml-2 hidden h-9 items-center px-1 text-[13px] font-medium transition-colors sm:inline-flex"
                  : "bg-ink text-bg ml-2 hidden h-9 items-center rounded-[var(--radius-pill)] px-4 text-[13px] font-semibold transition-opacity hover:opacity-90 sm:inline-flex"
              }
            >
              {t("contact")}
            </Link>
            {cta && (
              <Link
                href={cta.href as Href}
                className="border-ocean text-ocean hover:bg-ocean hover:text-on-accent ml-3 hidden h-9 items-center gap-1.5 rounded-[var(--radius-pill)] border px-4 text-[13px] font-semibold transition-colors sm:inline-flex"
              >
                {cta.label}
                <ArrowRight size={14} aria-hidden />
              </Link>
            )}
            {hasMembership && <SessionInfoButton variant="desktop" className="ml-2" />}
            <button
              type="button"
              className="text-ink inline-flex h-10 w-10 items-center justify-center rounded-full lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? tc("closeMenu") : tc("openMenu")}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-bg fixed inset-0 top-16 z-40 overflow-y-auto lg:hidden"
          >
            <div className="mx-auto max-w-7xl px-5 py-5 sm:px-6">
              <ul className="flex flex-col">
                {navEntries.map((entry, i) => renderMobile(entry, i))}
                <li className="border-line border-b">
                  <Link
                    href="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="text-ink block py-4 text-xl font-semibold"
                  >
                    {t("contact")}
                  </Link>
                </li>
                {/* The CTA is `sm:inline-flex` in the bar, so on a phone the
                    drawer is the only place the site's primary action exists. */}
                {cta && (
                  <li className="border-line border-b">
                    <Link
                      href={cta.href as Href}
                      onClick={() => setMobileOpen(false)}
                      className="text-ocean flex items-center gap-2 py-4 text-xl font-semibold"
                    >
                      {cta.label}
                      <ArrowRight size={18} aria-hidden />
                    </Link>
                  </li>
                )}
                {hasMembership && (
                  <li className="border-line border-b">
                    <SessionInfoButton variant="mobile" onNavigate={() => setMobileOpen(false)} />
                  </li>
                )}
              </ul>
              {hasMultipleLocales && (
                <div className="mt-8">
                  <p className="type-label text-ink-3 mb-4">Language</p>
                  <MobileLanguageSwitcher onSelect={() => setMobileOpen(false)} />
                </div>
              )}

              {!themeLocked && (
                <div className="mt-8">
                  <p className="type-label text-ink-3 mb-4">Appearance</p>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="border-line bg-surface text-ink hover:bg-surface-2 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[15px] font-semibold transition-colors"
                  >
                    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                    {theme === "dark" ? tc("switchToLight") : tc("switchToDark")}
                  </button>
                </div>
              )}

              {site.socials.length > 0 && (
                <div className="mt-8 pb-8">
                  <p className="type-label text-ink-3 mb-4">Follow</p>
                  <ul className="flex flex-wrap gap-2">
                    {site.socials.map((s) => (
                      <li key={s.name}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.name}
                          className="bg-surface text-ink hover:bg-surface-2 inline-flex h-11 w-11 items-center justify-center rounded-full"
                        >
                          {socialIconMap[s.name] ?? <span className="h-2 w-2 rounded-full bg-current" />}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Expanded menu panel — icon, label and blurb per destination, plus an optional
 * feature tile.
 *
 * The old dropdown was a 230px-wide stack of 14px links, which for a section
 * like Innovation ("Science / Education / Technology / Community") gave a visitor
 * four bare nouns and no basis for choosing. Widening it to carry one line of
 * explanation per item is the difference between a menu and an index.
 */
function MenuPanel({
  entry,
  navText,
  isCurrent,
  onNavigate,
}: {
  entry: Extract<NavEntry, { kind: "group" }>;
  navText: (key: string) => string;
  isCurrent: (href: string) => boolean;
  onNavigate: () => void;
}) {
  const hasBlurbs = entry.children.some((c) => c.description);
  const hasFeature = !!entry.feature;
  return (
    <div
      className="bg-elevated border-line-strong overflow-hidden rounded-[var(--radius-card)] border shadow-[0_24px_48px_-20px_rgba(0,0,0,0.28)]"
      style={{ width: hasFeature ? "min(46rem, 84vw)" : hasBlurbs ? "min(26rem, 84vw)" : "15rem" }}
    >
      <div className={hasFeature ? "grid sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]" : undefined}>
        <ul className="p-2">
          {entry.children.map((child) => (
            <MenuItem key={child.href} child={child} navText={navText} current={isCurrent(child.href)} onNavigate={onNavigate} />
          ))}
        </ul>
        {entry.feature && (
          <Link
            href={entry.feature.href as Href}
            onClick={onNavigate}
            className="border-line group relative hidden overflow-hidden sm:block sm:border-l"
          >
            <Image
              src={entry.feature.image}
              alt=""
              width={520}
              height={620}
              sizes="20rem"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            {entry.feature.label && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pt-10">
                <span className="type-label flex items-center gap-2 text-white/90">
                  {entry.feature.label}
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </span>
            )}
          </Link>
        )}
      </div>
    </div>
  );
}

function MenuItem({
  child,
  navText,
  current,
  onNavigate,
}: {
  child: NavLeaf;
  navText: (key: string) => string;
  current: boolean;
  onNavigate: () => void;
}) {
  const Icon = resolveIcon(child.icon);
  return (
    <li>
      <Link
        href={child.href as Href}
        data-menuitem
        onClick={onNavigate}
        aria-current={current ? "true" : undefined}
        className={`hover:bg-surface flex items-start gap-3 rounded-[calc(var(--radius-card)*0.6)] px-3 py-2.5 transition-colors ${
          current ? "bg-surface" : ""
        }`}
      >
        {Icon ? (
          <span className="border-line-strong text-ink-2 mt-px flex h-7 w-7 flex-none items-center justify-center rounded-[calc(var(--radius-card)*0.4)] border">
            {/*
              `resolveIcon` is a lookup into a fixed module-level registry
              (src/lib/icons.ts), not a component defined during render — the
              reference is stable across renders, so `static-components` is a false
              positive here. Same pattern throughout `blocks/LeafBlocks.tsx`.
            */}
            {/* eslint-disable-next-line react-hooks/static-components */}
            <Icon size={14} strokeWidth={1.7} aria-hidden />
          </span>
        ) : (
          <span className="bg-ink-3 mt-2.5 h-1 w-1 flex-none rounded-full" aria-hidden />
        )}
        <span className="min-w-0">
          <span className="text-ink block text-[14px] font-medium">{navText(child.nameKey)}</span>
          {child.description && (
            <span className="text-ink-3 mt-0.5 block text-[12.5px] leading-snug">{child.description}</span>
          )}
        </span>
      </Link>
    </li>
  );
}
