/**
 * Members-only content is decided on the server (security review TZS-2, EBE-6325).
 *
 * Until engine 2.8.11 the vault and gallery pages were client components: every insider drop
 * (title, description, link) and every gated photo shipped in the page's scripts and HTML, and
 * the browser only blurred what a non-member should not see. This test fails on that code:
 *
 *   1. No "use client" file under src/ imports the vault or gallery data as a value, so the
 *      data never enters a browser bundle (a type-only import is fine).
 *   2. The vault and gallery pages are server components.
 *   3. visibleDrops() gives a non-member an insider drop's id, type, date and tier only, and
 *      gives a member the whole drop; a private file becomes a signed link that expires, and
 *      no link at all without Cloudinary settings.
 *   4. The server membership check forwards only the hub's session cookie, and reads a FREE
 *      plan, a hub error, a slow hub or a missing cookie as "not a member".
 *
 * scripts/members-only-html.ts checks the same thing on a running build, over HTTP.
 *
 * Run: npx --yes tsx scripts/members-only.test.ts
 * Each module's part is skipped where a client site does not have that module's page. No
 * network: fetch is a stub.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const ROOT = path.resolve(__dirname, "..");
const VAULT_PAGE = "src/app/[locale]/vault/page.tsx";
const GALLERY_PAGE = "src/app/[locale]/gallery/page.tsx";
const hasVault = existsSync(path.join(ROOT, VAULT_PAGE));
const hasGallery = existsSync(path.join(ROOT, GALLERY_PAGE));

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

const isClient = (src: string) => /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*\s*["']use client["']/.test(src);
// A value import of the data module: `import { x } from "@/data/vault"` or a relative path to it,
// but not `import type { ... }`.
const dataImport = (mod: "vault" | "gallery") =>
  new RegExp(`import\\s+(?!type\\b)[^;]*?from\\s+["'](?:@/data/${mod}|(?:\\.\\.?/)+(?:[\\w-]+/)*data/${mod})(?:\\.json|\\.ts)?["']`);

type Drop = { id: string; tier: string; title: string; description: string; cta?: string; href?: string; locked?: boolean };
type Shown = { locked: boolean; id?: string; href?: string; cta?: string };
interface GateModule {
  VAULT_FILE_TTL_SECONDS: number;
  visibleDrops(drops: unknown, member: boolean, opts?: { cloudinary?: unknown; now?: number }): Shown[];
}
type Membership = { signedIn: boolean; member: boolean };
interface ServerModule {
  hubSessionCookies(h: string | null): string;
  memberFromSessionInfo(b: unknown): Membership;
  membershipForCookie(h: string | null, o?: Record<string, unknown>): Promise<Membership>;
}

async function main() {
  // AbortSignal.timeout's timer does not hold the process open; this does, so the slow-hub
  // case is awaited instead of the process quietly exiting 0 mid-test.
  const keepAlive = setInterval(() => {}, 1000);
  console.log("Browser bundles hold no members-only data");
  const files = walk(path.join(ROOT, "src"));
  for (const mod of ["vault", "gallery"] as const) {
    if (mod === "vault" ? !hasVault : !hasGallery) {
      console.log(`  - ${mod}: module not in this site, skipped`);
      continue;
    }
    const offenders = files
      .filter((f) => {
        const src = readFileSync(f, "utf8");
        return isClient(src) && dataImport(mod).test(src);
      })
      .map((f) => path.relative(ROOT, f));
    check(`no client component imports the ${mod} data`, offenders.length === 0, offenders.join(", "));
  }
  if (hasVault) check("the vault page is a server component", !isClient(readFileSync(path.join(ROOT, VAULT_PAGE), "utf8")));
  if (hasGallery) check("the gallery page is a server component", !isClient(readFileSync(path.join(ROOT, GALLERY_PAGE), "utf8")));

  if (hasGallery) {
    const blurImports = files
      .filter((f) => {
        const src = readFileSync(f, "utf8");
        return isClient(src) && /from\s+["'](?:@\/data\/|(?:\.\.?\/)+(?:[\w-]+\/)*data\/)gallery-blur(?:\.json|\.ts)?["']/.test(src);
      })
      .map((f) => path.relative(ROOT, f));
    check("no client component imports the gallery-only blur map", blurImports.length === 0, blurImports.join(", "));
    // The browser's blur map (image-blur.json, imported by client components site-wide) names no
    // photo that only the gallery shows: re-splitting the committed maps changes nothing.
    const splitMod = "./split-gallery-blur.mjs";
    const { splitGalleryBlur } = (await import(splitMod)) as { splitGalleryBlur(all: Record<string, string>): { publicMap: Record<string, string>; galleryMap: Record<string, string> } };
    const readMap = (rel: string) => (existsSync(path.join(ROOT, rel)) ? (JSON.parse(readFileSync(path.join(ROOT, rel), "utf8")) as Record<string, string>) : {});
    const pub = readMap("src/data/image-blur.json");
    const { publicMap } = splitGalleryBlur({ ...pub, ...readMap("src/data/gallery-blur.json") });
    const extra = Object.keys(pub).filter((k) => !(k in publicMap));
    check("the browser's blur map holds no gallery-only photo", extra.length === 0, `${extra.length}: ${extra.slice(0, 3).join(", ")} (run node scripts/split-gallery-blur.mjs)`);
    const { galleryOnlyPaths } = (await import(splitMod)) as { galleryOnlyPaths(): Set<string> };
    const only = galleryOnlyPaths();
    const sized = Object.keys(readMap("src/data/image-size.json")).filter((k) => only.has(k));
    check("the browser's size map holds no gallery-only photo", sized.length === 0, `${sized.length}: ${sized.slice(0, 3).join(", ")}`);
  }

  // Imported by a string and typed here, so a site without these modules still type-checks
  // this file (it ships to client repos).
  const gateMod = "../src/lib/vault-gate";
  const serverMod = "../src/lib/membership-server";
  const vaultDataMod = "../src/data/vault";

  if (hasVault) {
    console.log("visibleDrops");
    let gate: GateModule | null = null;
    try {
      gate = await import(gateMod);
    } catch (e) {
      check("src/lib/vault-gate.ts loads", false, String(e));
    }
    if (gate) {
      // Invented drops, so the test names no client.
      const drops = [
        { id: "kiln-open-day", tier: "free", type: "event", date: "2026-09-01", title: "Kiln open day", description: "Come and see the kiln.", cta: "Details", href: "/tour" },
        { id: "glaze-notes", tier: "insider", type: "download", date: "2026-09-02", title: "SECRET-TITLE glaze notes", description: "SECRET-DESCRIPTION the full recipe book.", cta: "Download", href: "https://example.invalid/SECRET-HREF" },
        { id: "seconds-sale", tier: "insider", type: "presale", date: "2026-09-03", title: "SECRET-TITLE seconds sale", description: "SECRET-DESCRIPTION early access.", cta: "Get it", file: { publicId: "kopje/SECRET-FILE", resourceType: "raw" } },
      ] as const;
      const cfg = { cloud: "democloud", key: "111", secret: "s3cr3t", folder: "x" };
      const now = Date.UTC(2026, 9, 28, 0, 0, 0);

      const out = gate.visibleDrops(drops, false, { cloudinary: cfg, now });
      const text = JSON.stringify(out);
      check("a non-member gets no insider title, text, link or file", !/SECRET-/.test(text), text);
      check("a non-member still sees each insider drop as locked", out.filter((d) => d.locked).length === 2);
      check(
        "a locked drop carries a position id, type, date and tier only",
        out.filter((d) => d.locked).every((d) => Object.keys(d).sort().join() === "date,id,locked,tier,type" && /^locked-\d+$/.test(String((d as { id?: string }).id))),
      );
      check("a free drop is whole for a non-member", JSON.stringify(out[0]).includes("Kiln open day"));

      const m = gate.visibleDrops(drops, true, { cloudinary: cfg, now });
      check("a member gets the insider drop whole", JSON.stringify(m[1]).includes("SECRET-TITLE glaze notes") && !m[1].locked);
      const link = !m[2].locked ? m[2].href ?? "" : "";
      const q = new URL(link || "https://x.invalid").searchParams;
      check(
        "a member's private file is a signed download link",
        link.startsWith("https://api.cloudinary.com/v1_1/democloud/raw/download?") && q.get("type") === "private" && !!q.get("signature"),
        link,
      );
      check(
        `the link expires ${gate.VAULT_FILE_TTL_SECONDS} s after it is made`,
        Number(q.get("expires_at")) - Number(q.get("timestamp")) === gate.VAULT_FILE_TTL_SECONDS && Number(q.get("timestamp")) === now / 1000,
      );
      check("the secret is not in the link", !link.includes("s3cr3t"));
      const none = gate.visibleDrops(drops, true, { cloudinary: null, now });
      check("without Cloudinary settings a private file gets no button", !none[2].locked && !none[2].href && !none[2].cta);

      // The site's own data: a non-member's view holds none of its insider text.
      const { vaultDrops } = (await import(vaultDataMod)) as { vaultDrops: Drop[] };
      const own = JSON.stringify(gate.visibleDrops(vaultDrops, false, { cloudinary: null }));
      const leaked = vaultDrops
        .filter((d) => d.tier !== "free")
        .flatMap((d) => [d.title, d.description, d.href].filter((s): s is string => !!s && s.length > 3))
        .filter((s) => own.includes(JSON.stringify(s).slice(1, -1)));
      check("this site's insider drops are absent from a non-member's view", leaked.length === 0, leaked.join(" | "));
    }
  }

  if (hasVault || hasGallery) {
    console.log("Server membership check");
    let srv: ServerModule | null = null;
    try {
      srv = await import(serverMod);
    } catch (e) {
      check("src/lib/membership-server.ts loads", false, String(e));
    }
    if (srv) {
      check(
        "only the hub's session cookie is forwarded",
        srv.hubSessionCookies("crm_admin=abc; __Secure-ebenworks-session.0=p1; theme=x; __Secure-ebenworks-session.1=p2") ===
          "__Secure-ebenworks-session.0=p1; __Secure-ebenworks-session.1=p2",
      );
      check("a look-alike cookie name is not forwarded", srv.hubSessionCookies("evil-ebenworks-session=1; ebenworks-session-x=2") === "");
      check("an active paid plan is a member", srv.memberFromSessionInfo({ signedIn: true, membership: { active: true, plan: "STARTER" } }).member);
      check("an active FREE plan is not a member", !srv.memberFromSessionInfo({ signedIn: true, membership: { active: true, plan: "FREE" } }).member);
      check("signed out is not a member", !srv.memberFromSessionInfo({ signedIn: false, membership: { active: true, plan: "STARTER" } }).member);
      check("an odd body is not a member", !srv.memberFromSessionInfo("yes").member && !srv.memberFromSessionInfo(null).member);

      const calls: { url: string; cookie: string }[] = [];
      const stub = (answer: () => Response | Promise<Response>) =>
        (async (url: string | URL | Request, init?: RequestInit) => {
          calls.push({ url: String(url), cookie: String((init?.headers as Record<string, string>)?.cookie ?? "") });
          return answer();
        }) as typeof fetch;
      const base = { provider: "hub", hub: "https://hub.example.invalid/", product: "KOPJE_SITE" };
      const paid = () => Response.json({ signedIn: true, membership: { active: true, plan: "STARTER" } });

      calls.length = 0;
      const noCookie = await srv.membershipForCookie("theme=dark", { ...base, fetchImpl: stub(paid) });
      check("no hub cookie: no member, and the hub is not asked", !noCookie.member && calls.length === 0);

      calls.length = 0;
      const ok = await srv.membershipForCookie("crm_admin=abc; ebenworks-session=tok", { ...base, fetchImpl: stub(paid) });
      check("a paid session is a member", ok.member && ok.signedIn);
      check(
        "the hub is asked for this site's product with the hub cookie alone",
        calls[0]?.url === "https://hub.example.invalid/api/session-info?product=KOPJE_SITE" && calls[0]?.cookie === "ebenworks-session=tok",
        JSON.stringify(calls[0]),
      );

      calls.length = 0;
      await srv.membershipForCookie("ebenworks-session=fan", { ...base, fetchImpl: stub(() => Response.json({ signedIn: true })) });
      const paidNow = await srv.membershipForCookie("ebenworks-session=fan", { ...base, fetchImpl: stub(paid) });
      check("a non-member answer is not cached (a fan who just paid is asked again)", paidNow.member && calls.length === 2);

      calls.length = 0;
      const again = await srv.membershipForCookie("ebenworks-session=tok", { ...base, fetchImpl: stub(paid) });
      check("the same session within a minute is answered from the cache", again.member && calls.length === 0);
      const down = await srv.membershipForCookie("ebenworks-session=tok", { ...base, now: Date.now() + 5 * 60_000, fetchImpl: stub(() => new Response("busy", { status: 429 })) });
      check("a member the hub cannot be asked about keeps access for ten minutes", down.member && calls.length === 1);
      const later = await srv.membershipForCookie("ebenworks-session=tok", { ...base, now: Date.now() + 6 * 60_000, fetchImpl: stub(() => Response.json({ signedIn: false })) });
      check("a definite answer from the hub wins over the cache", !later.member && calls.length === 2);
      const gone = await srv.membershipForCookie("ebenworks-session=tok", { ...base, now: Date.now() + 7 * 60_000, fetchImpl: stub(() => new Response("busy", { status: 429 })) });
      check("after a definite no, a hub failure does not bring access back", !gone.member);

      const err = await srv.membershipForCookie("ebenworks-session=err", { ...base, fetchImpl: stub(() => new Response("no", { status: 500 })) });
      check("a hub error is not a member", !err.member);
      const thrown = await srv.membershipForCookie("ebenworks-session=down", {
        ...base,
        fetchImpl: (async () => {
          throw new Error("down");
        }) as typeof fetch,
      });
      check("an unreachable hub is not a member", !thrown.member);
      const slow = await srv.membershipForCookie("ebenworks-session=slow", {
        ...base,
        timeoutMs: 50,
        fetchImpl: ((_u: unknown, init?: RequestInit) =>
          new Promise<Response>((_res, rej) => init?.signal?.addEventListener("abort", () => rej(new Error("aborted"))))) as typeof fetch,
      });
      check("a hub slower than the timeout is not a member", !slow.member);
      const noProduct = await srv.membershipForCookie("ebenworks-session=noproduct", { ...base, product: "", fetchImpl: stub(paid) });
      check("no product key is not a member", !noProduct.member);
      const none = await srv.membershipForCookie("ebenworks-session=none", { ...base, provider: "none", fetchImpl: stub(paid) });
      check('provider "none" is not a member', !none.member);
    }
  }

  clearInterval(keepAlive);
  console.log(fails ? `\n${fails} check(s) failed` : "\nAll members-only checks passed");
  process.exit(fails ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
