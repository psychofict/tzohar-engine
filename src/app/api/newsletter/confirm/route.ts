import { NextRequest } from "next/server";
import { site } from "@/config/site";
import { siteColours } from "@/lib/email/siteMail";
import { CONFIRM_TTL_SECONDS, openSignup } from "@/lib/mail-confirm";
import { allowCaller, firstUse, isDone, markDone, readTextCapped, releaseUse } from "@/lib/mail-guard";
import { completeSignup } from "@/lib/signup";

// The page the confirm mail links to (TZS-4, EBE-6326). Opening the link only shows a button: mail
// scanners follow links, so the sign-up completes on the button's POST, once per link.

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function page(status: number, heading: string, body: string, token?: string): Response {
  const c = siteColours(site);
  const home = site.url.replace(/\/$/, "");
  const action = token
    ? `<form method="post" action="/api/newsletter/confirm"><input type="hidden" name="t" value="${esc(token)}"><button type="submit">Confirm my address</button></form>`
    : `<a class="link" href="${esc(home)}">Back to ${esc(site.name)}</a>`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="color-scheme" content="light">
<title>${esc(heading)} · ${esc(site.name)}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#faf8f4;color:#17140f;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  main{width:100%;max-width:460px;background:#fff;border:1px solid #e7e2d8;border-radius:20px;padding:40px 32px;box-shadow:0 1px 2px rgba(23,20,15,.04),0 12px 32px rgba(23,20,15,.06)}
  .site{margin:0 0 28px;font-size:12px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:${c.text}}
  h1{margin:0 0 12px;font-size:28px;line-height:1.2;letter-spacing:-.01em;font-weight:650}
  p{margin:0 0 28px;font-size:16px;line-height:1.6;color:#4a443a}
  button{appearance:none;border:0;cursor:pointer;width:100%;height:48px;border-radius:999px;background:${c.fill};color:${c.fillType};font:inherit;font-size:15px;font-weight:600}
  button:focus-visible,.link:focus-visible{outline:2px solid ${c.text};outline-offset:3px}
  .link{color:${c.text};font-weight:600;text-decoration:underline;text-underline-offset:3px}
</style>
</head>
<body>
<main>
<p class="site">${esc(site.name)}</p>
<h1>${esc(heading)}</h1>
<p>${esc(body)}</p>
${action}
</main>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer" },
  });
}

const expired = () =>
  page(400, "This link has expired", "Confirm links work for two days. Sign up again on the site and we'll send you a new one.");

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const signup = openSignup(token);
  if (!signup) return expired();
  const what = signup.kind === "superfan" ? `the ${site.name} Inner Circle` : `the ${site.name} mailing list`;
  return page(200, "Confirm your address", `Press the button to join ${what}.`, token);
}

export async function POST(req: NextRequest) {
  try {
    const caller = await allowCaller(req, "confirm");
    if (!caller.ok) return page(caller.status, "Please try again shortly", "Too many requests from this connection. Try again in a few minutes.");
    const read = await readTextCapped(req, 4 * 1024);
    const token = read.ok ? new URLSearchParams(read.text).get("t") : null;
    const signup = openSignup(token);
    if (!token || !signup) return expired();

    const retry = () => page(503, "Please try again shortly", "We couldn't finish just now. Open the link again in a few minutes.");
    const confirmed = () => page(200, "You're already confirmed", "This address is confirmed. There's nothing more to do.");
    // A link that went through stays done for its whole life (the "done" mark), whatever the lease.
    const doneBefore = await isDone(`confirm:${token}`);
    if (doneBefore === null) return retry();
    if (doneBefore) return confirmed();
    // A short lease while this press works; a press that crashed or timed out frees the link
    // within minutes.
    const first = await firstUse(`confirm:${token}`, 5 * 60);
    if (first === null) return retry();
    if (!first) return page(409, "Still working on it", "Your sign-up is being finished. Open this link again in a minute.");
    // Another press may have finished between the two reads.
    const doneNow = await isDone(`confirm:${token}`);
    if (doneNow === null) {
      await releaseUse(`confirm:${token}`);
      return retry();
    }
    if (doneNow) return confirmed();

    let result: Awaited<ReturnType<typeof completeSignup>>;
    try {
      result = await completeSignup(signup);
    } catch (e) {
      await releaseUse(`confirm:${token}`);
      throw e;
    }
    // Nothing was recorded unless the owner's note went: the same link may be pressed again.
    if (result === "done") await markDone(`confirm:${token}`, CONFIRM_TTL_SECONDS + 3600);
    else await releaseUse(`confirm:${token}`);
    if (result === "store") return page(503, "Please try again shortly", "We couldn't finish just now. Open the link again in a few minutes.");
    if (result === "busy") return page(429, "Please try again tomorrow", "The site has had a lot of sign-ups today. Open this link again tomorrow.");
    if (result === "failed") return page(502, "Something went wrong", "We couldn't finish your sign-up. Open this link again in a few minutes.");
    return signup.kind === "superfan"
      ? page(200, "You're in the Inner Circle", "Your address is confirmed. Watch your inbox for the welcome.")
      : page(200, "You're on the list", "Your address is confirmed. Watch your inbox for the welcome.");
  } catch (error) {
    console.error("Sign-up confirm error:", error);
    return page(500, "Something went wrong", "We couldn't finish your sign-up. Open this link again in a few minutes.");
  }
}
