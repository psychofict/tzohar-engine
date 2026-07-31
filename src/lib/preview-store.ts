import { appearanceStyle, type SiteConfig, type SitePage } from "@tzohar/schema";
import { fontVarStyle } from "./font-vars";

/**
 * LIVE PREVIEW — the client site, driven by Studio's unsaved draft.
 *
 * Studio used to preview a site by RE-IMPLEMENTING it: ~600 lines of `sp-*`
 * mini-components approximating a ~3000-line engine. Measured against this very
 * site it rendered 9 sections where the real page has 12, half the document
 * height, and body type where the design calls for the display face. An
 * approximation of a renderer can only ever converge on the real thing by
 * duplicating it, and it silently drifts every time the engine gains a block.
 *
 * So the preview is now the site itself, in an iframe, told what the draft is.
 * Fidelity is not "close" — it is the same components, the same Tailwind build,
 * the same fonts, the same motion, because it IS the deployed page.
 *
 * Two things arrive over `postMessage` and are applied without a reload:
 *
 *   • APPEARANCE — recomputed with `appearanceStyle()`, the exact generator the
 *     server injects into <head>. Swapping that one <style> element is why a
 *     colour, font, radius or paper change looks right rather than approximately
 *     right. Every font family the engine offers is already loaded as a CSS
 *     variable on <html>, so switching typeface costs no network request.
 *
 *   • BLOCKS — the whole block layer is already `"use client"`, so a draft page
 *     re-renders through the real `ComposedPage`. Nothing is mocked.
 *
 * Deliberately NOT a React context: the draft has to reach a component nested
 * under server components that cannot forward a provider value, so this is a
 * module-level store read with `useSyncExternalStore`.
 */

export const PREVIEW_PARAM = "tzohar-preview";
const STYLE_ID = "tzohar-preview-appearance";

export interface PreviewDraft {
  config?: SiteConfig;
  /** The page being edited, keyed by slug so a route only takes its own. */
  page?: SitePage;
  /** Bumped by Studio so identical payloads still count as a change. */
  rev?: number;
}

type Listener = () => void;

let draft: PreviewDraft = {};
let active = false;
let installed = false;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export function subscribePreview(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getPreviewDraft(): PreviewDraft {
  return draft;
}

/** Server render and first client render must agree, so this is always false there. */
export function getPreviewServerSnapshot(): PreviewDraft {
  return EMPTY;
}
const EMPTY: PreviewDraft = {};

/** True when this page was opened by Studio as a preview surface. */
export function previewRequested(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has(PREVIEW_PARAM);
}

export function previewActive(): boolean {
  return active;
}

function applyAppearance(config: SiteConfig) {
  const root = document.documentElement;
  root.setAttribute("data-theme", config.theme ?? "default");

  // Mode: an explicit light/dark in the draft wins, mirroring the server's
  // `forcedMode`. `system` leaves whatever the visitor's OS says.
  const mode = config.appearance?.mode;
  if (mode === "dark") root.classList.add("dark");
  else if (mode === "light") root.classList.remove("dark");

  /*
   * The font pairing MUST be written inline on <html>, because that is where the
   * server writes it and an inline style beats every stylesheet. Injecting only
   * the <style> block changed a draft's colours while its typeface stayed on the
   * published one — verified against the live site before this was added.
   * Clearing the properties when the draft has no pairing restores the default
   * rather than pinning whatever was previewed last.
   */
  const fonts = fontVarStyle(config.appearance?.font);
  if (fonts) {
    root.style.setProperty("--font-body", fonts["--font-body"]);
    root.style.setProperty("--font-display", fonts["--font-display"]);
  } else {
    root.style.removeProperty("--font-body");
    root.style.removeProperty("--font-display");
  }

  const css = appearanceStyle(config);
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    // Appended last so it wins on source order against the server's own
    // appearance block, exactly as the server's wins against globals.css.
    document.head.appendChild(el);
  }
  el.textContent = css;
}

/** Force the visitor's colour mode from Studio's light/dark toggle. */
function applyMode(mode: "light" | "dark") {
  document.documentElement.classList.toggle("dark", mode === "dark");
}

/**
 * Scroll a section into view and mark it, so selecting a block in Studio moves
 * the preview to it. Sections are matched by ordinal because a block has no
 * stable identity in the DOM unless the author happened to set an anchor `id`.
 */
function scrollToSection(index: number) {
  const sections = document.querySelectorAll<HTMLElement>("main > section, main > div > section");
  const el = sections[index];
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("tzohar-preview-flash");
  window.setTimeout(() => el.classList.remove("tzohar-preview-flash"), 1400);
}

/**
 * Install the message listener. Idempotent, and a no-op unless the URL carries
 * the preview parameter — the bridge ships in every build, so it must cost a
 * normal visitor nothing but a parameter check.
 */
export function installPreviewBridge(): void {
  if (installed || typeof window === "undefined") return;
  if (!previewRequested()) return;
  installed = true;
  active = true;

  window.addEventListener("message", (ev: MessageEvent) => {
    const data = ev.data as { type?: string; [k: string]: unknown } | null;
    if (!data || typeof data.type !== "string" || !data.type.startsWith("tzohar:")) return;

    switch (data.type) {
      case "tzohar:draft": {
        const next: PreviewDraft = {
          config: data.config as SiteConfig | undefined,
          page: data.page as SitePage | undefined,
          rev: typeof data.rev === "number" ? data.rev : (draft.rev ?? 0) + 1,
        };
        if (next.config) {
          try {
            applyAppearance(next.config);
          } catch {
            /* a half-typed colour must not take the preview down */
          }
        }
        draft = next;
        emit();
        break;
      }
      case "tzohar:mode":
        if (data.mode === "light" || data.mode === "dark") applyMode(data.mode);
        break;
      case "tzohar:scrollTo":
        if (typeof data.index === "number") scrollToSection(data.index);
        break;
    }
  });

  // Tell Studio the real site is live. Studio waits for this and falls back to
  // its sketch renderer if it never arrives (site not deployed yet, or the host
  // refuses to be framed) rather than showing an empty rectangle.
  const announce = () => {
    try {
      window.parent?.postMessage({ type: "tzohar:preview:ready", href: window.location.href }, "*");
    } catch {
      /* not framed */
    }
  };
  announce();
  // Studio may attach its listener after our first shout.
  window.setTimeout(announce, 250);
  window.setTimeout(announce, 1200);
}
