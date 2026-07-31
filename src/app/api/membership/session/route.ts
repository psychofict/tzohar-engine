import { NextRequest, NextResponse } from "next/server";
import { stripe, verify, slugForPrice, MEMBER_COOKIE } from "@/lib/stripe";

export const runtime = "nodejs";

// Returns the SAME shape as the hub's session-info, so useMembership() is
// provider-agnostic: { signedIn, name, email, image, membership? }. Membership
// is read live from Stripe via the signed access cookie.
const SIGNED_OUT = { signedIn: false, name: null, email: null, image: null };

export async function GET(req: NextRequest) {
  const customer = verify(req.cookies.get(MEMBER_COOKIE)?.value);
  if (!stripe || !customer) return NextResponse.json(SIGNED_OUT);

  try {
    const cust = await stripe.customers.retrieve(customer);
    const subs = await stripe.subscriptions.list({
      customer,
      status: "active",
      limit: 1,
      expand: ["data.items.data.price"],
    });

    const deleted = !cust || "deleted" in cust;
    const name = deleted ? null : cust.name ?? null;
    const email = deleted ? null : cust.email ?? null;

    const sub = subs.data[0];
    if (!sub) {
      return NextResponse.json({
        signedIn: true,
        name,
        email,
        image: null,
        membership: { active: false, plan: null },
      });
    }

    const item = sub.items.data[0];
    const plan = slugForPrice(item?.price.id);
    // current_period_end lives on the subscription in older API versions and on
    // the item in newer ones — read defensively across SDK/API versions.
    const periodEnd =
      (item as unknown as { current_period_end?: number })?.current_period_end ??
      (sub as unknown as { current_period_end?: number }).current_period_end;

    return NextResponse.json({
      signedIn: true,
      name,
      email,
      image: null,
      membership: {
        active: true,
        plan,
        planName: plan,
        status: sub.status,
        renewsAt: periodEnd ? new Date(periodEnd * 1000).toISOString() : undefined,
        manageUrl: "/api/membership/portal",
      },
    });
  } catch (err) {
    console.error("Stripe session error:", err);
    return NextResponse.json(SIGNED_OUT);
  }
}
