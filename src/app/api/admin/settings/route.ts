import { NextResponse, type NextRequest } from "next/server";
import { configSchema } from "@tzohar/schema";
import { refuseCrmRequest } from "@/lib/crm/guard";
import { CrmContentError, checkEdit, crmFailure } from "@/lib/crm/errors";
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
  const refused = refuseCrmRequest(req, { body: "json" });
  if (refused) return refused;

  let patch: Record<string, unknown>;
  try {
    patch = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Expected a JSON body." }, { status: 400 });
  }
  if (typeof patch !== "object" || patch === null || Array.isArray(patch)) {
    return NextResponse.json({ success: false, error: "Expected a JSON object." }, { status: 400 });
  }

  try {
    const current = await readJson<Record<string, unknown>>(FILE);
    // Whether the stored file parses on its own. If it does not, a save that repairs it
    // still goes through; one that leaves it broken is not the editor's mistake, so the
    // fixed text applies (src/lib/crm/errors.ts).
    const stored = configSchema.safeParse(current);
    const storedProblem = stored.success
      ? null
      : new Error("stored site.values.json does not parse", { cause: stored.error });
    const next: Record<string, unknown> = { ...current };
    for (const key of EDITABLE) {
      if (key in patch) next[key] = patch[key as Editable];
    }

    // Validate the WHOLE config, not just the patch: a bad `seo.keywords` shape
    // would otherwise reach the engine's loader and fail the build instead.
    try {
      checkEdit(() => configSchema.parse(next));
    } catch (err) {
      // A failure in a field this save rewrites is the editor's to fix, broken store or not;
      // only an editable key the save sent counts, and only those issues are told to the editor.
      const own = (i: { path?: PropertyKey[] }) =>
        typeof i.path?.[0] === "string" && (EDITABLE as readonly string[]).includes(i.path[0]) && Object.hasOwn(patch, i.path[0]);
      if (err instanceof CrmContentError && err.issues.some(own)) throw new CrmContentError(err.issues.filter(own));
      throw storedProblem ?? err;
    }

    const result = await writeFiles(
      [{ path: FILE, content: JSON.stringify(next, null, 2) + "\n" }],
      "crm: update site settings",
    );
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return crmFailure(err, "settings");
  }
}
