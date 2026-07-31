import { NextResponse, type NextRequest } from "next/server";
import { configSchema } from "@tzohar/schema";
import { hasCrmSession } from "@/lib/crm/auth";
import { readJson, writeFiles } from "@/lib/crm/store";

const FILE = "src/config/site.values.json";

/**
 * Site settings. Only a named set of fields is accepted.
 *
 * `site.values.json` also carries `modules`, `appearance` and `layout`, which
 * decide which routes exist and how the whole design system resolves. Those are
 * build-shaping decisions, not copy — an accidental edit there takes the site
 * down rather than making it say something different — so the CRM merges over a
 * whitelist and leaves the rest of the document untouched.
 */
const EDITABLE = ["name", "tagline", "description", "email", "url", "seo", "socials", "location"] as const;
type Editable = (typeof EDITABLE)[number];

export async function POST(req: NextRequest) {
  if (!(await hasCrmSession())) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  let patch: Record<string, unknown>;
  try {
    patch = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Expected a JSON body." }, { status: 400 });
  }

  try {
    const current = await readJson<Record<string, unknown>>(FILE);
    const next: Record<string, unknown> = { ...current };
    for (const key of EDITABLE) {
      if (key in patch) next[key] = patch[key as Editable];
    }

    // Validate the WHOLE config, not just the patch: a bad `seo.keywords` shape
    // would otherwise reach the engine's loader and fail the build instead.
    configSchema.parse(next);

    const result = await writeFiles(
      [{ path: FILE, content: JSON.stringify(next, null, 2) + "\n" }],
      "crm: update site settings",
    );
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}
