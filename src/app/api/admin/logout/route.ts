import { NextResponse, type NextRequest } from "next/server";
import { CRM_COOKIE } from "@/lib/crm/auth";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin/login", req.url), 303);
  res.cookies.set(CRM_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
