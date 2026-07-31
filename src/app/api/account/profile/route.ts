import { NextRequest, NextResponse } from "next/server";
import { membership } from "@/config/membership";

// Same-origin proxy to the hub's per-product profile KV
// (GET/PUT /api/userdata/<hubProduct> — cookie-authed). The browser holds the
// shared .ebenworks.co session cookie; we forward it server-side. No secrets here.
// The stored blob is this site's own profile prefs, e.g.
//   { displayName?: string, notify?: { releases, tour, drops } }

const HUB = (process.env.ACCOUNTS_URL || process.env.NEXT_PUBLIC_ACCOUNTS_URL || "").replace(/\/+$/, "");
// The client's own key, no fallback — reading and WRITING another product's KV
// under a hardcoded key is how one site's visitors edit another site's profiles.
const PRODUCT = membership.hubProduct ?? "";

function hubFetch(method: string, cookie: string, body?: string) {
  return fetch(`${HUB}/api/userdata/${PRODUCT}`, {
    method,
    headers: {
      accept: "application/json",
      cookie,
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
    },
    body,
  });
}

async function relay(r: Response): Promise<NextResponse> {
  const j = await r.json().catch(() => null);
  if (r.status === 401 || r.status === 403) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!r.ok) {
    return NextResponse.json({ error: j?.error || "Couldn't reach your profile." }, { status: r.status });
  }
  // Hub wraps in { success, data } — return the bare blob.
  return NextResponse.json(j?.data ?? {});
}

export async function GET(req: NextRequest) {
  if (!HUB || !PRODUCT) return NextResponse.json({ error: "Profile is not configured." }, { status: 503 });
  const cookie = req.headers.get("cookie") ?? "";
  if (!cookie) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  try {
    return await relay(await hubFetch("GET", cookie));
  } catch (e) {
    console.error("Profile GET proxy error:", e);
    return NextResponse.json({ error: "Couldn't reach your profile." }, { status: 502 });
  }
}

export async function PUT(req: NextRequest) {
  if (!HUB || !PRODUCT) return NextResponse.json({ error: "Profile is not configured." }, { status: 503 });
  const cookie = req.headers.get("cookie") ?? "";
  if (!cookie) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.text();
  try {
    return await relay(await hubFetch("PUT", cookie, body));
  } catch (e) {
    console.error("Profile PUT proxy error:", e);
    return NextResponse.json({ error: "Couldn't save your profile." }, { status: 502 });
  }
}
