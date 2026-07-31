import { NextRequest, NextResponse } from "next/server";
import { stripe, verify, MEMBER_COOKIE } from "@/lib/stripe";

export const runtime = "nodejs";

// Create a Stripe Billing Portal session for the signed-in customer and redirect
// to it. Used as the member's "manage membership" link.
export async function GET(req: NextRequest) {
  const customer = verify(req.cookies.get(MEMBER_COOKIE)?.value);
  if (!stripe || !customer) return NextResponse.redirect(new URL("/join", req.url));

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer,
      return_url: new URL("/account", req.url).toString(),
    });
    return NextResponse.redirect(portal.url);
  } catch (err) {
    console.error("Stripe portal error:", err);
    return NextResponse.redirect(new URL("/account", req.url));
  }
}
