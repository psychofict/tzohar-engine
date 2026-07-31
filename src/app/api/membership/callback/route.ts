import { NextRequest, NextResponse } from "next/server";
import { stripe, sign, MEMBER_COOKIE } from "@/lib/stripe";

export const runtime = "nodejs";

// Stripe Checkout success_url target. Looks up the completed session, then sets
// the signed access cookie (the Stripe customer id) and sends the new member to
// their account. Membership is then read live from Stripe on each request.
export async function GET(req: NextRequest) {
  const home = new URL("/", req.url);
  if (!stripe) return NextResponse.redirect(home);

  const id = req.nextUrl.searchParams.get("session_id");
  if (!id) return NextResponse.redirect(home);

  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    const customer =
      typeof session.customer === "string" ? session.customer : session.customer?.id;

    const res = NextResponse.redirect(new URL("/account", req.url));
    if (customer) {
      res.cookies.set(MEMBER_COOKIE, sign(customer), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 180, // 180 days
      });
    }
    return res;
  } catch (err) {
    console.error("Stripe callback error:", err);
    return NextResponse.redirect(home);
  }
}
