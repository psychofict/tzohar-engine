import { NextRequest, NextResponse } from "next/server";
import { stripe, priceFor } from "@/lib/stripe";

export const runtime = "nodejs";

// Create a Stripe subscription Checkout Session for a plan slug + interval.
// On success Stripe redirects to /api/membership/callback, which sets the
// signed access cookie. The client pays only Stripe's fee — no platform cut.
export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Membership is not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = typeof body.plan === "string" ? body.plan : "";
  const interval: "month" | "year" = body.interval === "year" ? "year" : "month";

  const price = priceFor(plan, interval);
  if (!price) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  const origin = req.nextUrl.origin;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/api/membership/callback?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/join`,
      allow_promotion_codes: true,
    });
    if (!session.url) {
      return NextResponse.json({ error: "No checkout URL returned." }, { status: 502 });
    }
    return NextResponse.json({ redirectUrl: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Checkout is unavailable right now." }, { status: 502 });
  }
}
