import { NextResponse, type NextRequest } from "next/server";
import { CRM_COOKIE, CRM_COOKIE_OPTIONS, LEGACY_CRM_COOKIE } from "@/lib/crm/auth";
import { refuseCrmRequest } from "@/lib/crm/guard";

export async function POST(req: NextRequest) {
  const refused = refuseCrmRequest(req, { body: null, session: false, form: true });
  if (refused) return refused;

  const res = NextResponse.redirect(new URL("/admin/login", req.url), 303);
  res.cookies.set(CRM_COOKIE, "", { ...CRM_COOKIE_OPTIONS, maxAge: 0 });
  // The cookie engines before TZS-5 set, so an upgraded site leaves none behind.
  res.cookies.set(LEGACY_CRM_COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
  return res;
}
