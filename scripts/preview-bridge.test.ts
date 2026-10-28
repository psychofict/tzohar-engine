/**
 * The live-preview bridge takes a draft only from Studio framing the page (TZS-7, EBE-6334).
 * Made-up site and draft; the window, its parent and the posting pages are stand-ins.
 *
 * Run: npx --yes tsx scripts/preview-bridge.test.ts
 *
 * Uses only functions older engines have too, so on code before the fix it shows the fault:
 * a page that opened the site posts an invented draft and the site renders it.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

// A developer's own setting must not change what this test sees (the child inherits this too).
delete process.env.NEXT_PUBLIC_TZOHAR_STUDIO_DEV_ORIGIN;

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const STUDIO = "https://studio.ebenworks.co";
type Listener = (ev: { origin: string; source: unknown; data: unknown }) => void;

/** A stand-in browser window at the client's real address with ?tzohar-preview=1. */
function makeWindow(framedBy: "studio-frame" | "none") {
  const listeners: Listener[] = [];
  const posted: { msg: unknown; target: string }[] = [];
  const win: Record<string, unknown> = {
    location: { search: "?tzohar-preview=1", href: "https://kopje-light.example/?tzohar-preview=1" },
    addEventListener: (type: string, fn: Listener) => {
      if (type === "message") listeners.push(fn);
    },
    setTimeout: () => 0,
  };
  const parent = { postMessage: (msg: unknown, target: string) => posted.push({ msg, target }) };
  win.parent = framedBy === "none" ? win : parent;
  return { win, parent, listeners, posted, send: (ev: { origin: string; source: unknown; data: unknown }) => listeners.forEach((l) => l(ev)) };
}

const draftFrom = (title: string, rev: number) => ({ type: "tzohar:draft", page: { slug: "home", title, blocks: [] }, rev });

async function unframed(): Promise<void> {
  const top = makeWindow("none");
  (globalThis as Record<string, unknown>).window = top.win;
  const fresh = await import("../src/lib/preview-store");
  const requested = fresh.previewRequested();
  fresh.installPreviewBridge();
  top.send({ origin: STUDIO, source: top.win, data: draftFrom("Posted into an unframed page", 5) });
  console.log(`UNFRAMED ${JSON.stringify({ requested, title: fresh.getPreviewDraft().page?.title ?? null, posted: top.posted.length })}`);
}

async function main(): Promise<void> {
  console.log("Framed by Studio");
  const w = makeWindow("studio-frame");
  (globalThis as Record<string, unknown>).window = w.win;
  const bridge = await import("../src/lib/preview-store");
  check("a framed page with the preview parameter is a preview", bridge.previewRequested());
  bridge.installPreviewBridge();

  const opener = { postMessage: () => undefined }; // a page that opened the site in its own window
  w.send({ origin: "https://phish.example", source: opener, data: draftFrom("Invented offer: send your bank details", 1) });
  check("a draft from another origin is ignored", bridge.getPreviewDraft().page?.title !== "Invented offer: send your bank details", JSON.stringify(bridge.getPreviewDraft()));
  w.send({ origin: STUDIO, source: opener, data: draftFrom("Studio origin, wrong window", 2) });
  check("a draft from Studio's origin but not from the framing window is ignored", bridge.getPreviewDraft().page?.title !== "Studio origin, wrong window");
  w.send({ origin: "https://phish.example", source: w.parent, data: draftFrom("Framing page, wrong origin", 3) });
  check("a draft from the framing window on another origin is ignored", bridge.getPreviewDraft().page?.title !== "Framing page, wrong origin");
  w.send({ origin: STUDIO, source: w.parent, data: draftFrom("Kopje Light Ceramics, draft", 4) });
  check("Studio's draft, from the framing window, is shown", bridge.getPreviewDraft().page?.title === "Kopje Light Ceramics, draft", JSON.stringify(bridge.getPreviewDraft()));

  check("the ready message was sent", w.posted.length > 0);
  check("the ready message goes to Studio's origin only, never '*'", w.posted.length > 0 && w.posted.every((p) => p.target === STUDIO), JSON.stringify(w.posted.map((p) => p.target)));

  console.log("Opened in a window of its own (not framed)");
  // A fresh process, so the bridge module starts uninstalled under an unframed window.
  const child = spawnSync(process.execPath, [...process.execArgv, process.argv[1], "--unframed"], { encoding: "utf8", env: process.env });
  const line = (child.stdout || "").split("\n").find((l) => l.startsWith("UNFRAMED "));
  const r = line ? (JSON.parse(line.slice(9)) as { requested: boolean; title: string | null; posted: number }) : null;
  check("the preview parameter alone does not make a preview", !!r && !r.requested, child.stderr.slice(0, 300));
  check("an unframed page takes no draft, even from Studio's origin", !!r && r.title !== "Posted into an unframed page");
  check("an unframed page announces nothing", !!r && r.posted === 0);

  console.log("Origins");
  const origins = (bridge as { studioOrigins?: () => string[] }).studioOrigins;
  const env = process.env as Record<string, string | undefined>;
  const nodeEnv = env.NODE_ENV;
  env.NEXT_PUBLIC_TZOHAR_STUDIO_DEV_ORIGIN = "http://localhost:3001";
  env.NODE_ENV = "production";
  check("Studio's origin is the one accepted in production, whatever the dev setting says", typeof origins === "function" && JSON.stringify(origins()) === JSON.stringify([STUDIO]));
  env.NODE_ENV = "development";
  check("development adds the local Studio origin from config", typeof origins === "function" && JSON.stringify(origins()) === JSON.stringify([STUDIO, "http://localhost:3001"]));
  env.NEXT_PUBLIC_TZOHAR_STUDIO_DEV_ORIGIN = "http://localhost:3001; frame-ancestors *";
  check("a dev setting that is not an origin is ignored", typeof origins === "function" && JSON.stringify(origins()) === JSON.stringify([STUDIO]));
  // The frame rule: only `next dev` adds the local Studio, whatever NODE_ENV a build runs under.
  env.NEXT_PUBLIC_TZOHAR_STUDIO_DEV_ORIGIN = "http://localhost:3001";
  env.NODE_ENV = "test";
  const { default: makeConfig } = (await import("../next.config")) as unknown as { default: (phase: string) => { headers?: () => Promise<{ headers: { key: string; value: string }[] }[]> } };
  const frameRule = async (phase: string) =>
    ((await makeConfig(phase).headers?.()) ?? []).flatMap((h) => h.headers).find((h) => h.key === "Content-Security-Policy")?.value ?? "";
  // The engine itself always carries studio/engine.release.json; a client repo does not.
  const inEngine = existsSync(new URL("../studio/engine.release.json", import.meta.url));
  if (typeof makeConfig !== "function" && inEngine) {
    check("the engine's next.config.ts is a function of Next's phase", false, "the default export is not a function");
  } else if (typeof makeConfig !== "function") {
    // A client repo that keeps its own next.config.ts exports an object; its frame rule is its own.
    console.log("  - skipped: this repository's next.config.ts is its own (not a function of the phase)");
  } else {
    const devRule = await frameRule("phase-development-server");
    const built = await frameRule("phase-production-build");
    const served = await frameRule("phase-production-server");
    check("a build under NODE_ENV=test frames for Studio alone, even after a dev load", built === "frame-ancestors 'self' https://studio.ebenworks.co" && served === built, `${built} | ${served}`);
    check("next dev adds the local Studio to the frame rule", devRule === "frame-ancestors 'self' https://studio.ebenworks.co http://localhost:3001", devRule);
    env.NEXT_PUBLIC_TZOHAR_STUDIO_DEV_ORIGIN = "http://LocalHost:3001";
    check("a dev origin in capitals is lowercased for the frame rule", (await frameRule("phase-development-server")).endsWith(" http://localhost:3001"));
    env.NEXT_PUBLIC_TZOHAR_STUDIO_DEV_ORIGIN = "http://localhost:3001/";
    check("a trailing slash is dropped as a browser would", (await frameRule("phase-development-server")).endsWith(" http://localhost:3001"));
    env.NEXT_PUBLIC_TZOHAR_STUDIO_DEV_ORIGIN = "http://LocalHost:3001";
    env.NODE_ENV = "development";
    check("and for the bridge, which compares the browser's lowercase origin", typeof origins === "function" && origins().includes("http://localhost:3001"));
    env.NEXT_PUBLIC_TZOHAR_STUDIO_DEV_ORIGIN = "http://localhost:80";
    check("a default port is dropped as the browser's ev.origin drops it", typeof origins === "function" && origins().includes("http://localhost"));
    env.NODE_ENV = "test";
  }
  delete env.NEXT_PUBLIC_TZOHAR_STUDIO_DEV_ORIGIN;
  env.NODE_ENV = nodeEnv;

  if (fails) {
    console.log(`\n${fails} failed`);
    process.exit(1);
  }
  console.log("\nall passed");
}

(process.argv.includes("--unframed") ? unframed() : main()).catch((e) => {
  console.error(e);
  process.exit(1);
});
