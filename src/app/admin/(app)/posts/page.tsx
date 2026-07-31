import Link from "next/link";
import { allPosts, postCategories } from "@/data/posts";
import { formatPostDate } from "@/lib/posts-format";

export const dynamic = "force-dynamic";

export default function AdminPostsPage() {
  const sorted = [...allPosts].sort((a, b) => (a.date < b.date ? 1 : -1));
  const label = (key?: string) =>
    key ? (postCategories.find((c) => c.key === key)?.label ?? key) : "—";

  return (
    <>
      <header className="crm-head">
        <div>
          <p className="crm-label">Content</p>
          <h1>Posts</h1>
          <p className="crm-hint">Opinion articles, research commentary, policy briefs and blog entries.</p>
        </div>
        <Link href="/admin/posts/new" className="crm-btn crm-btn--primary">
          New post
        </Link>
      </header>

      {sorted.length === 0 ? (
        <div className="crm-note">No posts yet. Create the first one.</div>
      ) : (
        <div className="crm-rows">
          {sorted.map((post) => (
            <div key={post.slug} className="crm-row">
              <span className="crm-mono" style={{ fontSize: 11.5, color: "var(--ink-3)", flex: "none", width: 96 }}>
                {post.date}
              </span>
              <span className="crm-row-main">
                <span className="crm-row-title">{post.title}</span>
                <span className="crm-hint">
                  {label(post.category)} · <span className="crm-mono">/posts/{post.slug}</span>
                  {post.publication ? ` · ${post.publication}` : ""}
                </span>
              </span>
              <span className={`crm-pill ${post.draft ? "crm-pill--draft" : "crm-pill--live"}`}>
                {post.draft ? "Draft" : "Live"}
              </span>
              <span className="crm-row-actions">
                <a
                  className="crm-btn crm-btn--sm"
                  href={`/posts/${post.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`View ${post.title}`}
                >
                  View
                </a>
                <Link className="crm-btn crm-btn--sm" href={`/admin/posts/${post.slug}`}>
                  Edit
                </Link>
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="crm-hint" style={{ marginTop: 16 }}>
        Dates are ISO (<span className="crm-mono">YYYY-MM-DD</span>) and drive the ordering. Newest first:{" "}
        {sorted[0] ? formatPostDate(sorted[0].date) : "—"}.
      </p>
    </>
  );
}
