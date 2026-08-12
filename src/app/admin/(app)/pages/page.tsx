import Link from "next/link";
import { composedPages } from "@/data/pages";

export const dynamic = "force-dynamic";

export default function AdminPagesPage() {
  return (
    <>
      <header className="crm-head">
        <div>
          <p className="crm-label">Content</p>
          <h1>Pages</h1>
          <p className="crm-hint">
            Each page is an ordered list of sections. Reorder them, edit their text, or hide one.
          </p>
        </div>
      </header>

      <div className="crm-rows">
        {composedPages.map((page) => (
          <div key={page.slug} className="crm-row">
            <span className="crm-row-main">
              <span className="crm-row-title">{page.title}</span>
              <span className="crm-hint">
                <span className="crm-mono">{page.slug === "home" ? "/" : `/${page.slug}`}</span> · {page.blocks.length}{" "}
                sections
                {/* `nav` and `nav.inBar` are two different things now: a page can
                    be listed in the footer sitemap without taking a top-level
                    tab. Saying "in the menu" for both would describe the top bar
                    wrongly for exactly the pages deliberately kept out of it. */}
                {!page.nav
                  ? " · not in the menu"
                  : page.nav.inBar === false
                    ? ` · footer only, as “${page.nav.label}”`
                    : ` · a top tab, as “${page.nav.label}”`}
              </span>
            </span>
            <span className="crm-row-actions">
              <a
                className="crm-btn crm-btn--sm"
                href={page.slug === "home" ? "/" : `/${page.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                View
              </a>
              <Link className="crm-btn crm-btn--sm" href={`/admin/pages/${page.slug}`}>
                Edit
              </Link>
            </span>
          </div>
        ))}
      </div>

      <div className="crm-note" style={{ marginTop: 18 }}>
        Adding or removing whole pages, and changing which section types a page uses, is a design change rather than a
        content one — it needs a developer. Everything a page <em>says</em> is editable here.
      </div>
    </>
  );
}
