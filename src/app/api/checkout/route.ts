import { NextRequest, NextResponse } from "next/server";
import { membership } from "@/config/membership";

// Same-origin proxy to the accounts hub's checkout. The browser holds the shared
// `.ebenworks.co` session cookie; we forward it server-side to the hub's cookie-authed
// `POST /api/payments/checkout`, so no payment secret and no INTER_SERVICE_SECRET
// ever touch this site. The hub validates the user, resolves the price for
// (<hubProduct>, <plan>, USD) from its PriceTable, and returns a hosted Stripe
// Checkout URL. Stripe is the fleet gateway.

// Server route: prefer a runtime (non-inlined) ACCOUNTS_URL so this works even
// if the env is set after the build; fall back to the build-inlined public var.
const HUB = (process.env.ACCOUNTS_URL || process.env.NEXT_PUBLIC_ACCOUNTS_URL || "").replace(/\/+$/, "");
/*
 * From the client's own config, with NO fallback — this route used to hardcode
 * the reference build's product key, so a client whose membership.ts named their
 * own product still checked out against somebody else's PriceTable and took a
 * payment for the wrong thing. Empty means unconfigured, and unconfigured means
 * 503, matching src/lib/membership.ts's fail-closed contract.
 */
const PRODUCT = membership.hubProduct ?? "";

export async function POST(req: NextRequest) {
  if (!HUB || !PRODUCT) {
    return NextResponse.json({ error: "Membership is not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = typeof body.plan === "string" ? body.plan : "";
  const interval = body.interval === "year" ? "year" : "month";
  if (!plan) {
    return NextResponse.json({ error: "Missing plan." }, { status: 400 });
  }

  const cookie = req.headers.get("cookie") ?? "";
  if (!cookie) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    const r = await fetch(`${HUB}/api/payments/checkout`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ product: PRODUCT, plan, gateway: "stripe", interval }),
    });

    const data = await r.json().catch(() => null);

    if (r.status === 401 || r.status === 403) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error || data?.data?.error || "Checkout is unavailable right now." },
        { status: r.status },
      );
    }

    const redirectUrl = data?.redirectUrl ?? data?.data?.redirectUrl;
    if (!redirectUrl) {
      return NextResponse.json({ error: "No checkout URL returned." }, { status: 502 });
    }
    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error("Checkout proxy error:", err);
    return NextResponse.json({ error: "Checkout is unavailable right now." }, { status: 502 });
  }
}
