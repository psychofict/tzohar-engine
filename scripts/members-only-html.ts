/**
 * Over HTTP, against a running build: does a visitor's copy of /vault and /gallery, the HTML
 * and every script it loads, hold members-only content? (security review TZS-2, EBE-6325)
 *
 *   npx --yes tsx scripts/members-only-html.ts http://localhost:3061            # signed out: must hold none
 *   npx --yes tsx scripts/members-only-html.ts http://localhost:3061 --member "ebenworks-session=..."
 *                                                                               # a paid member: must hold it all
 *
 * A string the home page's HTML also shows (a social link, a photo used there too) is public
 * site-wide and is left out. A gallery photo's address is checked when the photo is gallery-only,
 * that is, absent from the browser's blur map (scripts/split-gallery-blur.mjs); a photo another
 * page shows is public anyway. Files in public/ stay reachable by anyone who has the address.
 * A module the site does not have is skipped.
 *
 * The site under test reads membership from ACCOUNTS_URL; point it at a local stand-in for the
 * hub, never at the real one with a real session. Exit 1 on any failed check.
 */
const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? "").replace(/\/+$/, "");
const mi = args.indexOf("--member");
const memberCookie = mi >= 0 ? args[mi + 1] ?? "" : "";
if (!base) {
  console.error("usage: members-only-html.ts <base url> [--member <cookie header>]");
  process.exit(2);
}

type Drop = { id: string; cta?: string; file?: unknown; tier: string; title: string; description: string; href?: string };
type Item = { src: string; alt: string };

const htmlEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

async function grab(path: string, withScripts = true): Promise<string> {
  const r = await fetch(base + path, { headers: memberCookie ? { cookie: memberCookie } : {}, redirect: "follow" });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  const html = await r.text();
  if (!withScripts) return html;
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)].map((m) => m[1]);
  const bodies = await Promise.all(
    [...new Set(scripts)].map(async (s) => {
      const u = s.startsWith("http") ? s : base + (s.startsWith("/") ? s : `/${s}`);
      const res = await fetch(u);
      return res.ok ? res.text() : "";
    }),
  );
  console.log(`  ${path}: ${html.length} bytes of HTML, ${scripts.length} scripts`);
  return [html, ...bodies].join("\n");
}

async function main() {
  const { existsSync } = await import("node:fs");
  const { join } = await import("node:path");
  const root = join(__dirname, "..");
  const present = (rel: string) => existsSync(join(root, rel));
  const load = async <T,>(rel: string): Promise<T | null> => (present(`${rel}.ts`) ? ((await import(`../${rel}`)) as T) : null);

  let fails = 0;
  const member = !!memberCookie;
  console.log(member ? "As a paid member (must see everything)" : "Signed out (must see no members-only content)");

  const home = await grab("/", false);
  const has = (page: string, s: string) => page.includes(s) || page.includes(htmlEscape(s)) || page.includes(JSON.stringify(s).slice(1, -1));
  const pageOnly = (list: string[]) => {
    const everywhere = list.filter((s) => has(home, s));
    if (everywhere.length) console.log(`  left out, shown on the home page too: ${everywhere.length}`);
    return list.filter((s) => !everywhere.includes(s));
  };

  const vaultMod = present("src/app/[locale]/vault/page.tsx") ? await load<{ vaultDrops: Drop[] }>("src/data/vault") : null;
  if (!vaultMod) console.log("  - vault: module not in this site, skipped");
  else {
    const vault = await grab("/vault");
    const insider = pageOnly(
      vaultMod.vaultDrops
        .filter((d) => d.tier !== "free")
        // A link shows only on a drop with a button (`cta`), and a private `file` replaces `href`.
        .flatMap((d) => [d.id, d.title, d.description, d.cta && !d.file ? d.href : undefined])
        .filter((s): s is string => !!s && s.length > 3 && s !== "#" && !s.startsWith("/")),
    );
    const inVault = insider.filter((s) => has(vault, s));
    console.log(`  vault: ${inVault.length} of ${insider.length} insider strings (ids, titles, texts, links) present`);
    if (member ? inVault.length !== insider.length : inVault.length > 0) {
      fails++;
      console.log(`  ✗ ${member ? "missing" : "leaked"}: ${(member ? insider.filter((s) => !inVault.includes(s)) : inVault).join(" | ")}`);
    } else console.log("  ✓ vault");
  }

  const galleryMod = present("src/app/[locale]/gallery/page.tsx") ? await load<{ galleryItems: Item[] }>("src/data/gallery") : null;
  if (!galleryMod) console.log("  - gallery: module not in this site, skipped");
  else {
    const gallery = await grab("/gallery");
    // Gallery-only photos worked out from the content itself, never from a map that may be stale.
    const splitMod = "./split-gallery-blur.mjs";
    const { galleryOnlyPaths } = (await import(splitMod)) as { galleryOnlyPaths(): Set<string> };
    const only = galleryOnlyPaths();
    const gated = pageOnly(galleryMod.galleryItems.flatMap((i) => (only.has(i.src) ? [i.src, i.alt] : [i.alt])));
    const inGallery = gated.filter((s) => has(gallery, s) || gallery.includes(encodeURIComponent(s)));
    console.log(`  gallery: ${inGallery.length} of ${gated.length} captions and gallery-only photo addresses present`);
    if (member ? gated.length > 0 && inGallery.length === 0 : inGallery.length > 0) {
      fails++;
      console.log(`  ✗ ${member ? "no photos for a member" : `leaked: ${inGallery.slice(0, 6).join(" | ")}${inGallery.length > 6 ? " ..." : ""}`}`);
    } else console.log("  ✓ gallery");
  }

  console.log(fails ? `\n${fails} check(s) failed` : "\nAll checks passed");
  process.exit(fails ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
