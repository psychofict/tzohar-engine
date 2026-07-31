import Link from "next/link";
import { allPosts } from "@/data/posts";
import { composedPages } from "@/data/pages";
import { listPublicDir, storeStatus } from "@/lib/crm/store";
import { mediaGroups } from "@/lib/crm/media";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const drafts = allPosts.filter((p) => p.draft).length;
  // Counted across whatever directories this site actually declares, so the
  // tile is right on every build rather than only on the one it was written for.
  const groups = await Promise.all(mediaGroups().map((g) => listPublicDir(g.dir)));
  const files = groups.flat();
  const video = files.filter((f) => /\.(mp4|webm|mov|m4v)$/i.test(f.path));
  const images = files.filter((f) => !video.includes(f));
  const store = storeStatus();

  const blockCount = composedPages.reduce((n, p) => n + p.blocks.length, 0);

  return (
    <>
      <header className="crm-head">
        <div>
          <p className="crm-label">Dashboard</p>
          <h1>Manage {site.name}</h1>
        </div>
      </header>

      <div className="crm-grid crm-grid--3" style={{ marginBottom: 26 }}>
        <Link href="/admin/posts" className="crm-tile">
          <p className="crm-tile-n">{allPosts.length}</p>
          <p style={{ fontWeight: 550, marginTop: 4 }}>Posts</p>
          <p className="crm-hint">
            {drafts > 0 ? `${drafts} draft${drafts === 1 ? "" : "s"} · ` : ""}Articles, commentary, policy briefs
          </p>
        </Link>
        <Link href="/admin/pages" className="crm-tile">
          <p className="crm-tile-n">{composedPages.length}</p>
          <p style={{ fontWeight: 550, marginTop: 4 }}>Pages</p>
          <p className="crm-hint">{blockCount} sections across the site</p>
        </Link>
        <Link href="/admin/media" className="crm-tile">
          <p className="crm-tile-n">{files.length}</p>
          <p style={{ fontWeight: 550, marginTop: 4 }}>Media</p>
          <p className="crm-hint">
            {images.length} images · {video.length} video files
          </p>
        </Link>
      </div>

      <div className="crm-grid crm-grid--2">
        <section className="crm-card">
          <h2>Recent posts</h2>
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {allPosts.slice(0, 5).map((p) => (
              <Link
                key={p.slug}
                href={`/admin/posts/${p.slug}`}
                style={{ textDecoration: "none", display: "flex", gap: 10, alignItems: "baseline" }}
              >
                <span className="crm-mono" style={{ fontSize: 11.5, color: "var(--ink-3)", flex: "none" }}>
                  {p.date}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>{p.title}</span>
                {p.draft && <span className="crm-pill crm-pill--draft">Draft</span>}
              </Link>
            ))}
            {allPosts.length === 0 && <p className="crm-hint">No posts yet.</p>}
          </div>
          <div className="crm-actions">
            <Link href="/admin/posts/new" className="crm-btn crm-btn--primary">
              New post
            </Link>
            <Link href="/admin/posts" className="crm-btn">
              All posts
            </Link>
          </div>
        </section>

        <section className="crm-card">
          <h2>Publishing</h2>
          {store.problem ? (
            /*
              Said plainly, because the alternative is worse than saying nothing:
              with publishing unconfigured this card used to report that saves
              "write straight to the files in this checkout", which on a
              read-only deployment is the opposite of what happens.
            */
            <>
              <div className="crm-note crm-note--bad" style={{ marginTop: 10 }}>
                <strong>Saving is not available yet.</strong>
                <p style={{ marginTop: 6 }}>{store.problem}</p>
              </div>
              <p className="crm-hint" style={{ marginTop: 12 }}>
                Everything here is readable, and nothing you do can damage the site — a save will refuse rather than
                half-apply. Ask whoever set the site up to add the missing setting; the steps are in{" "}
                <span className="crm-mono">docs/crm.md</span>.
              </p>
            </>
          ) : (
            <>
              <p className="crm-hint" style={{ marginTop: 8 }}>
                {store.driver === "github" ? (
                  <>
                    Saving commits to <span className="crm-mono">{store.target}</span>, which triggers a rebuild. Expect
                    changes to appear on the live site about a minute after you save.
                  </>
                ) : (
                  <>
                    Running against the <strong>local working tree</strong>. Saves write straight to the files in this
                    checkout — nothing is published anywhere.
                  </>
                )}
              </p>
              <div className="crm-note" style={{ marginTop: 14 }}>
                Every save is an ordinary git commit, so anything can be reviewed or reverted with normal git tools.
              </div>
            </>
          )}
          <div className="crm-actions">
            <Link href="/admin/help" className="crm-btn">
              How this works
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
