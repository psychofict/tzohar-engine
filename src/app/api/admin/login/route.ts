import { NextResponse, type NextRequest } from "next/server";
import { CRM_COOKIE, issueToken, passwordIsValid } from "@/lib/crm/auth";

/**
 * CRM sign-in. Form POST rather than fetch+JSON so it works with no JS and so the
 * password never lands in a URL or in the history stack.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  const rawNext = String(form.get("next") ?? "/admin");
  // Only ever redirect within the CRM — an attacker-supplied `next` must not be
  // able to turn the login form into an open redirect.
  const next = rawNext.startsWith("/admin") ? rawNext : "/admin";

  if (!passwordIsValid(password)) {
    // Cheap throttle: makes credential stuffing tedious without any state.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.redirect(new URL(`/admin/login?error=1&next=${encodeURIComponent(next)}`, req.url), 303);
  }

  const { value, maxAge } = issueToken();
  const res = NextResponse.redirect(new URL(next, req.url), 303);
  res.cookies.set(CRM_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    // Secure in production only, so http://localhost still works in dev.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return res;
}
