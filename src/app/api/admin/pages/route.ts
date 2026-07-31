import { NextResponse, type NextRequest } from "next/server";
import { pagesSchema, type SitePage } from "@tzohar/schema";
import { hasCrmSession } from "@/lib/crm/auth";
import { readJson, writeFiles } from "@/lib/crm/store";

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
  if (!(await hasCrmSession())) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  let body: { slug?: string; page?: SitePage };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Expected a JSON body." }, { status: 400 });
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

    const next = pagesSchema.parse({ ...doc, pages });
    const result = await writeFiles(
      [{ path: FILE, content: JSON.stringify(next, null, 2) + "\n" }],
      `crm: update page "${slug}"`,
    );
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}
