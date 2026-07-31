import { NextRequest, NextResponse } from "next/server";
import { MEMBER_COOKIE } from "@/lib/stripe";

export const runtime = "nodejs";

// Clear the access cookie and return home.
export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set(MEMBER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
