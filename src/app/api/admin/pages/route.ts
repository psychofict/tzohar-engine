import { NextResponse, type NextRequest } from "next/server";
import { pagesSchema, type SitePage } from "@tzohar/schema";
import { refuseCrmRequest } from "@/lib/crm/guard";
import { checkEdit, crmFailure } from "@/lib/crm/errors";
import { readJson, writeFiles } from "@/lib/crm/store";
import { BODY_CAPS, readJsonBody } from "@/lib/capped-body";

const FILE = "src/data/pages.json";

/**
 * Pages write API — replaces ONE page in the document.
 *
 * The client sends a whole page rather than a patch. Blocks are deeply nested and
 * order-significant (tabs contain blocks, blocks contain items), so a field-level
 * patch protocol would need to encode paths into that tree and would be far
 * easier to get subtly wrong than a whole-page replace. The document is small
 * enough that this costs nothing.
 *
 * `pagesSchema.parse` on the way out is the safety net: it enforces the block
 * contract and the unique-slug rule, so the CRM cannot commit a `pages.json`
 * that would fail the public build.
 */

export async function POST(req: NextRequest) {
  const refused = refuseCrmRequest(req, { body: "json" });
  if (refused) return refused;

  // Read under a byte cap as the body arrives (TZ-4 follow-up): a body sent in chunks declares no length.
  const read = await readJsonBody(req, BODY_CAPS.adminPage);
  if (!read.ok) {
    return NextResponse.json(
      { success: false, error: read.status === 413 ? "That page is too large to save." : "Expected a JSON body." },
      { status: read.status },
    );
  }
  const body = read.value as { slug?: string; page?: SitePage };
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ success: false, error: "Expected a JSON object." }, { status: 400 });
  }

  const { slug, page } = body;
  if (!slug || !page) {
    return NextResponse.json({ success: false, error: "Both slug and page are required." }, { status: 400 });
  }

  try {
    const doc = pagesSchema.parse(await readJson(FILE));
    const at = doc.pages.findIndex((p) => p.slug === slug);
    if (at < 0) {
      return NextResponse.json({ success: false, error: `No page with slug "${slug}".` }, { status: 404 });
    }
    const pages = [...doc.pages];
    pages[at] = page;

    const next = checkEdit(() => pagesSchema.parse({ ...doc, pages }));
    const result = await writeFiles(
      [{ path: FILE, content: JSON.stringify(next, null, 2) + "\n" }],
      `crm: update page "${slug}"`,
    );
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return crmFailure(err, "page");
  }
}
