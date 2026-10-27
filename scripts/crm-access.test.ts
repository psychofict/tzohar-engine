/**
 * The client CRM's access checks (security review TZS-5).
 *
 * 1. Every page under src/app/admin (the login page aside) starts with `await requireCrm()`,
 *    and every handler under src/app/api/admin starts with `refuseCrmRequest(...)`. A check in
 *    the layout alone is not enough: a navigation request that claims the layout is already on
 *    screen gets the page rendered without it.
 * 2. The write routes refuse another origin, a body of the wrong type, no session, and a site
 *    with the CRM module off; the sign-in sets a __Host- cookie that is Secure and
 *    SameSite=Strict, locks an address out after five wrong passwords, and a password change
 *    ends every session.
 *
 * Run: npx --yes tsx scripts/crm-access.test.ts
 * Made-up password and secret; writes nothing (each accepted request stops at validation).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { NextRequest } from "next/server";

process.env.CRM_PASSWORD = "made-up-crm-password";
process.env.CRM_SESSION_SECRET = "made-up-session-secret-for-the-test-0123";
process.env.CRM_DRIVER = "fs";

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const ROOT = join(__dirname, "..");
/** Every file under `dir` whose name matches (page.tsx, page.ts, route.js and so on). */
function walk(dir: string, name: RegExp): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p, name));
    else if (name.test(entry)) out.push(p);
  }
  return out;
}

function source(path: string) {
  return ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

const isExported = (n: ts.Node) =>
  ts.canHaveModifiers(n) && (ts.getModifiers(n) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
const isDefault = (n: ts.Node) =>
  ts.canHaveModifiers(n) && (ts.getModifiers(n) ?? []).some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);

/** The first statement of the page's (or layout's) default export is `await requireCrm();`. */
function pageGuarded(path: string): string | null {
  const sf = source(path);
  const fn = sf.statements.find((s) => ts.isFunctionDeclaration(s) && isExported(s) && isDefault(s)) as
    | ts.FunctionDeclaration
    | undefined;
  if (!fn?.body) return "no default-exported page function";
  const first = fn.body.statements[0];
  const ok =
    first &&
    ts.isExpressionStatement(first) &&
    ts.isAwaitExpression(first.expression) &&
    ts.isCallExpression(first.expression.expression) &&
    first.expression.expression.expression.getText(sf) === "requireCrm";
  return ok ? null : `first statement is "${first?.getText(sf).slice(0, 60) ?? "(none)"}"`;
}

const METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);

/**
 * Every exported method handler starts with `const refused = refuseCrmRequest(...)` and
 * `if (refused) return refused;`. Only sign-in and sign-out may pass `session: false`.
 */
function routeGuarded(path: string, mayGoWithoutSession: boolean): string[] {
  const sf = source(path);
  const problems: string[] = [];
  let handlers = 0;
  for (const s of sf.statements) {
    let name: string | undefined;
    let body: ts.Block | undefined;
    if (ts.isFunctionDeclaration(s) && isExported(s) && s.name) {
      name = s.name.text;
      body = s.body;
    } else if (ts.isVariableStatement(s) && isExported(s)) {
      for (const d of s.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && METHODS.has(d.name.text)) problems.push(`${d.name.text} is not a function declaration`);
      }
      continue;
    } else if (ts.isExportDeclaration(s)) {
      problems.push("re-exports a handler from elsewhere");
      continue;
    }
    if (!name || !METHODS.has(name)) continue;
    handlers++;
    const [first, second] = body?.statements ?? [];
    const decl =
      first && ts.isVariableStatement(first) ? first.declarationList.declarations[0] : undefined;
    const call = decl?.initializer && ts.isCallExpression(decl.initializer) ? decl.initializer : undefined;
    const okFirst = !!call && call.expression.getText(sf) === "refuseCrmRequest" && decl!.name.getText(sf) === "refused";
    const okSecond = !!second && second.getText(sf).replace(/\s+/g, " ") === "if (refused) return refused;";
    if (!okFirst || !okSecond) problems.push(`${name} does not start with refuseCrmRequest`);
    else if (!mayGoWithoutSession && /session\s*:\s*false/.test(call!.getText(sf))) {
      problems.push(`${name} skips the session check`);
    }
  }
  if (handlers === 0) problems.push("exports no handler");
  return problems;
}

async function main() {
  console.log("Every CRM page checks the session itself");
  // Pages, and any nested layout, template or default (each renders without its parent's
  // check). Exempt by exact path only: the root admin layout and the sign-in page.
  const exempt = new Set(
    ["src/app/admin/layout.tsx", "src/app/admin/login/page.tsx"].map((p) => join(ROOT, p)),
  );
  const pages = walk(join(ROOT, "src/app/admin"), /^(page|layout|template|default)\.[jt]sx?$/).filter(
    (p) => !exempt.has(p),
  );
  check("pages found", pages.length >= 9, String(pages.length));
  for (const p of pages) {
    const problem = pageGuarded(p);
    check(relative(ROOT, p), !problem, problem ?? "");
  }

  console.log("No metadata file or generateMetadata serves admin content unchecked");
  // Next serves these beside a page without running the page's requireCrm().
  const metaFiles = walk(join(ROOT, "src/app/admin"), /^((opengraph-image|twitter-image|icon|apple-icon)\d?|sitemap|manifest|robots)\.[jt]sx?$/);
  check("no metadata image or data route under src/app/admin", metaFiles.length === 0, metaFiles.map((p) => relative(ROOT, p)).join(", "));
  const metaExports = walk(join(ROOT, "src/app/admin"), /\.[jt]sx?$/).filter((p) => /\bgenerateMetadata\b/.test(readFileSync(p, "utf8")));
  check("no generateMetadata under src/app/admin", metaExports.length === 0, metaExports.map((p) => relative(ROOT, p)).join(", "));

  console.log("Every CRM route starts with refuseCrmRequest");
  // Route handlers under src/app/admin too: a handler never runs the (app) layout.
  const routes = [
    ...walk(join(ROOT, "src/app/api/admin"), /^route\.[jt]sx?$/),
    ...walk(join(ROOT, "src/app/admin"), /^route\.[jt]sx?$/),
  ];
  check("routes found", routes.length >= 6, String(routes.length));
  for (const r of routes) {
    const rel = relative(ROOT, r);
    const problems = routeGuarded(
      r,
      [join(ROOT, "src/app/api/admin/login/route.ts"), join(ROOT, "src/app/api/admin/logout/route.ts")].includes(r),
    );
    check(rel, problems.length === 0, problems.join("; "));
  }

  // Behaviour. Imported after the env is set; every request below stops before a write.
  const auth = await import("../src/lib/crm/auth");
  const { CRM_COOKIE, issueToken, tokenIsValid } = auth;
  const { site } = await import("../src/config/site");
  const posts = (await import("../src/app/api/admin/posts/route")).POST;
  const pagesRoute = (await import("../src/app/api/admin/pages/route")).POST;
  const settings = (await import("../src/app/api/admin/settings/route")).POST;
  const upload = (await import("../src/app/api/admin/upload/route")).POST;
  const login = (await import("../src/app/api/admin/login/route")).POST;
  const logout = (await import("../src/app/api/admin/logout/route")).POST;

  // A client site may have the CRM module off; the checks below need it on, and the
  // module-off section takes it away again.
  if (!site.modules.includes("crm")) site.modules.push("crm");

  const ORIGIN = "https://crm.kopje-light.example";
  const cookie = () => `${CRM_COOKIE}=${issueToken().value}`;
  const req = (path: string, headers: Record<string, string>, body: BodyInit | null = "{}") =>
    new NextRequest(`${ORIGIN}${path}`, { method: "POST", headers, body });
  const json = { "content-type": "application/json", origin: ORIGIN, "sec-fetch-site": "same-origin" };

  console.log("Write routes refuse what did not come from this site's own CRM");
  const own = await pagesRoute(req("/api/admin/pages", { ...json, cookie: cookie() }));
  check("own origin, JSON, signed in: reaches validation (400, nothing written)", own.status === 400, String(own.status));
  for (const [label, route, path] of [
    ["posts", posts, "/api/admin/posts"],
    ["pages", pagesRoute, "/api/admin/pages"],
    ["settings", settings, "/api/admin/settings"],
  ] as const) {
    const sibling = await route(
      req(path, { ...json, origin: "https://other-client.ebenworks.example", "sec-fetch-site": "same-site", cookie: cookie() }),
    );
    check(`${label}: a page on a sibling host is refused (403)`, sibling.status === 403, String(sibling.status));
    const noOrigin = await route(req(path, { "content-type": "application/json", cookie: cookie() }));
    check(`${label}: no Origin is refused (403)`, noOrigin.status === 403, String(noOrigin.status));
    const plain = await route(req(path, { ...json, "content-type": "text/plain", cookie: cookie() }));
    check(`${label}: a text/plain body is refused (415)`, plain.status === 415, String(plain.status));
    const signedOut = await route(req(path, json));
    check(`${label}: no session is refused (401)`, signedOut.status === 401, String(signedOut.status));
  }
  const crossSite = await posts(req("/api/admin/posts", { ...json, "sec-fetch-site": "cross-site", cookie: cookie() }));
  check("Sec-Fetch-Site other than same-origin is refused (403)", crossSite.status === 403, String(crossSite.status));
  const uploadJson = await upload(req("/api/admin/upload", { ...json, cookie: cookie() }));
  check("upload: a non-multipart body is refused (415)", uploadJson.status === 415, String(uploadJson.status));
  const uploadForeign = await upload(
    req("/api/admin/upload", { origin: "https://other.example", "content-type": "multipart/form-data; boundary=x", cookie: cookie() }, "--x--"),
  );
  check("upload: another origin is refused (403)", uploadForeign.status === 403, String(uploadForeign.status));

  console.log("A site with the CRM module off answers 404 on every CRM route");
  const at = site.modules.indexOf("crm");
  site.modules.splice(at, 1);
  check("module off for this section", !site.modules.includes("crm"));
  try {
    for (const [label, route, path] of [
      ["posts", posts, "/api/admin/posts"],
      ["pages", pagesRoute, "/api/admin/pages"],
      ["settings", settings, "/api/admin/settings"],
      ["upload", upload, "/api/admin/upload"],
    ] as const) {
      let status = 0;
      try {
        status = (await route(req(path, { ...json, cookie: cookie() }))).status;
      } catch (e) {
        status = String((e as { digest?: string }).digest ?? "").includes("404") ? 404 : -1;
      }
      check(`${label}: 404`, status === 404, String(status));
    }
  } finally {
    site.modules.splice(at, 0, "crm");
  }

  console.log("Sign-in");
  const form = (password: string, ip: string, origin = ORIGIN) =>
    req(
      "/api/admin/login",
      { "content-type": "application/x-www-form-urlencoded", origin, "sec-fetch-site": "same-origin", "x-real-ip": ip },
      new URLSearchParams({ password, next: "/admin" }).toString(),
    );
  const foreignLogin = await login(form("made-up-crm-password", "203.0.113.9", "https://other.example"));
  check(
    "a sign-in posted from another origin goes back to the login page, refused",
    foreignLogin.status === 303 && (foreignLogin.headers.get("location") ?? "").includes("error=refused") && !foreignLogin.headers.get("set-cookie"),
    `${foreignLogin.status} ${foreignLogin.headers.get("location")}`,
  );

  const ok = await login(form("made-up-crm-password", "203.0.113.10"));
  const setCookie = ok.headers.get("set-cookie") ?? "";
  check("right password: 303 to /admin", ok.status === 303 && (ok.headers.get("location") ?? "").endsWith("/admin"));
  check("cookie is __Host-tzohar_crm", setCookie.startsWith("__Host-tzohar_crm="), setCookie.split("=")[0]);
  check("cookie is Secure whatever NODE_ENV says", /;\s*secure/i.test(setCookie), setCookie.replace(/=[^;]+/, "=…"));
  check("cookie is SameSite=Strict", /samesite=strict/i.test(setCookie), setCookie.replace(/=[^;]+/, "=…"));
  check("cookie is HttpOnly on /", /httponly/i.test(setCookie) && /path=\//i.test(setCookie));
  const okCookies = ok.headers.getSetCookie?.() ?? [];
  const known = okCookies.find((c) => c.startsWith("__Host-tzohar_crm_known=")) ?? "";
  check("sign-in also sets a known-browser cookie, Secure and Strict", /secure/i.test(known) && /samesite=strict/i.test(known), known.replace(/=[^;]+/, "=…"));

  const ip = "203.0.113.11";
  let last = "";
  for (let i = 0; i < 5; i++) last = (await login(form("wrong-guess-" + i, ip))).headers.get("location") ?? "";
  check("the fifth wrong password locks the address", last.includes("error=locked"), last);
  const locked = await login(form("made-up-crm-password", ip));
  check(
    "while locked, even the right password is turned away",
    !locked.headers.get("set-cookie") && (locked.headers.get("location") ?? "").includes("error=locked"),
    locked.headers.get("location") ?? "",
  );
  const other = await login(form("made-up-crm-password", "203.0.113.12"));
  check("another address can still sign in", (other.headers.get("set-cookie") ?? "").includes("tzohar_crm="));

  console.log("Sessions");
  const token = issueToken().value;
  check("a fresh token is valid", tokenIsValid(token));
  process.env.CRM_PASSWORD = "made-up-crm-password-rotated";
  check("changing CRM_PASSWORD ends the session", !tokenIsValid(token));
  process.env.CRM_PASSWORD = "made-up-crm-password";
  check("and it is valid again under the old password", tokenIsValid(token));

  const out = await logout(req("/api/admin/logout", { origin: ORIGIN, "sec-fetch-site": "same-origin" }, null));
  const cleared = out.headers.getSetCookie?.() ?? [out.headers.get("set-cookie") ?? ""];
  const main = cleared.find((c) => c.startsWith(`${CRM_COOKIE}=`)) ?? "";
  check("logout clears the cookie with Secure and SameSite=Strict", /secure/i.test(main) && /samesite=strict/i.test(main), main);
  const foreignOut = await logout(req("/api/admin/logout", { origin: "https://other.example" }, null));
  check(
    "logout from another origin is refused and clears nothing",
    (foreignOut.headers.get("location") ?? "").includes("error=refused") && !foreignOut.headers.get("set-cookie"),
    `${foreignOut.status} ${foreignOut.headers.get("location")}`,
  );

  console.log("Lockout counters (in memory)");
  const { issueKnownBrowser, knownBrowserIsValid } = auth as unknown as {
    issueKnownBrowser?: () => { value: string };
    knownBrowserIsValid?: (v: string | undefined) => boolean;
  };
  const { lockoutKey, loginLockedFor, recordLoginFailure } = auth as unknown as {
    lockoutKey?: (a: string) => string;
    loginLockedFor?: (a: string, now?: number, knownBrowser?: boolean) => number;
    recordLoginFailure?: (a: string, now?: number, knownBrowser?: boolean) => void;
  };
  if (!lockoutKey || !loginLockedFor || !recordLoginFailure) {
    check("auth exports the lockout counters", false);
  } else {
    check("an IPv6 caller counts by its /64", lockoutKey("2001:db8:1:2:aaaa::1") === lockoutKey("2001:0db8:0001:0002:ffff:1:2:3"));
    check("another /64 counts apart", lockoutKey("2001:db8:1:3::1") !== lockoutKey("2001:db8:1:2::1"));
    check("an IPv4 address counts whole", lockoutKey("198.51.100.7") === "198.51.100.7" && lockoutKey("::ffff:198.51.100.7") === "198.51.100.7");
    check("an IPv4 address with a port counts as the address", lockoutKey("198.51.100.7:5678") === "198.51.100.7");
    check("[IPv6]:port counts by its /64", lockoutKey("[2001:db8:1:2::9]:443") === lockoutKey("2001:db8:1:2::1"));
    // A multiple of 15 minutes, so a window aligned to the clock and one opened by the first
    // failure both split the guesses below 4 and 4.
    const t0 = 1_899_999_900_000;
    const edge = "198.51.100.30";
    // One failure opens a fixed window at t0; four more just before 15 minutes and four just
    // after. A fixed window resets at 15:00 and stays open; a sliding one counts the last 15.
    recordLoginFailure(edge, t0);
    for (let i = 0; i < 3; i++) recordLoginFailure(edge, t0 + 14 * 60_000 + 59_000 + i);
    for (let i = 0; i < 4; i++) recordLoginFailure(edge, t0 + 15 * 60_000 + 1_000 + i);
    check("the window slides: 8 guesses across a 15-minute edge lock", loginLockedFor(edge, t0 + 15 * 60_000 + 2_000) > 0);
    const slow = "198.51.100.20";
    for (let i = 0; i < 4; i++) recordLoginFailure(slow, t0 + i * 60_000);
    recordLoginFailure(slow, t0 + 14 * 60_000);
    check("the lock runs 15 minutes from the fifth failure", loginLockedFor(slow, t0 + 28 * 60_000) > 0, String(loginLockedFor(slow, t0 + 28 * 60_000)));
    check("and ends after it", loginLockedFor(slow, t0 + 30 * 60_000) === 0);
    const t1 = t0 + 60 * 60_000;
    for (let i = 0; i < 50; i++) recordLoginFailure(`198.51.101.${i}`, t1 + i);
    check("50 failures from many addresses lock every sign-in", loginLockedFor("192.0.2.200", t1 + 1000) > 0);
    check("a known browser is let past the site-wide lock", loginLockedFor("192.0.2.77", t1 + 1000, true) === 0);
    const t2 = t1 + 2 * 60 * 60_000;
    for (let i = 0; i < 10; i++) recordLoginFailure(`198.51.102.${i}`, t2 + i, true);
    check("one known-browser cookie replayed from many addresses is capped (10 in 15 minutes)", loginLockedFor("192.0.2.78", t2 + 1000, true) > 0);
    const before = issueKnownBrowser ? issueKnownBrowser().value : "";
    const pw = process.env.CRM_PASSWORD;
    process.env.CRM_PASSWORD = "made-up-crm-password-changed-again";
    check("changing CRM_PASSWORD ends every known browser", !!knownBrowserIsValid && before !== "" && !knownBrowserIsValid(before));
    process.env.CRM_PASSWORD = pw;
    check(
      "the known-browser cookie verifies, and a forged one does not",
      !!issueKnownBrowser && !!knownBrowserIsValid && knownBrowserIsValid(issueKnownBrowser().value) && !knownBrowserIsValid("9999999999.forged"),
    );
    check("the site-wide lock ends too", loginLockedFor("192.0.2.200", t1 + 16 * 60_000) === 0);
  }

  console.log(fails ? `\n${fails} failed` : "\nall passed");
  process.exit(fails ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
