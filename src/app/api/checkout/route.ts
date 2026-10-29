import { NextRequest, NextResponse } from "next/server";
import { membership } from "@/config/membership";
import { hubSessionCookie } from "@/lib/hub-cookie";
import { isPreviewBuild } from "@/lib/preview-build";

// Same-origin proxy to the accounts hub's checkout. The browser holds the shared
// `.ebenworks.co` session cookie; we forward it server-side to the hub's cookie-authed
// `POST /api/payments/checkout`, so no payment secret and no INTER_SERVICE_SECRET
// ever touch this site. The hub validates the user, resolves the price for
// (<hubProduct>, <plan>) from its PriceTable, charges in USD, and returns a hosted Paynow URL.
// Paynow is the fleet's only gateway. No method is asked for here: the hosted page covers cards,
// Zimswitch and bank transfer, and the mobile-money rails need a phone number this proxy has no
// business collecting.

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
  // A preview build sells nothing (src/lib/preview-build.ts, EBE-7066): before launch no licence
  // or payout terms are in place, so the request is refused before anything is read or sent to
  // the hub, and no checkout page is ever opened from a preview.
  if (isPreviewBuild) {
    return NextResponse.json({ error: "Memberships open when this site launches." }, { status: 404 });
  }
  if (!HUB || !PRODUCT) {
    return NextResponse.json({ error: "Membership is not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = typeof body.plan === "string" ? body.plan : "";
  const interval = body.interval === "year" ? "year" : "month";
  if (!plan) {
    return NextResponse.json({ error: "Missing plan." }, { status: 400 });
  }

  // Only the hub's own session cookie goes to the hub (TZS-12).
  const cookie = hubSessionCookie(req.headers.get("cookie"));
  if (!cookie) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    const r = await fetch(`${HUB}/api/payments/checkout`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ product: PRODUCT, plan, gateway: "paynow", interval }),
    });

    const data = await r.json().catch(() => null);

    if (r.status === 401 || r.status === 403) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }
    // A plan already running (or a price that changed) and too many attempts are the fan's
    // to act on, so they keep their status, in the engine's own words.
    if (r.status === 409) {
      console.error("Checkout proxy: hub answered 409", data?.error || data?.data?.error || "");
      return NextResponse.json(
        { error: "You may already have this plan, or its price has changed. Reload the page and check your account." },
        { status: 409 },
      );
    }
    if (r.status === 429) {
      return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
    }
    if (!r.ok) {
      // The hub's own text and status stay in the log (TZS-12).
      console.error("Checkout proxy: hub answered", r.status, data?.error || data?.data?.error || "");
      return NextResponse.json({ error: "Checkout is unavailable right now." }, { status: 502 });
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
