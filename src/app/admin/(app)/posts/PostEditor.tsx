"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Post } from "@tzohar/schema";

type Category = { key: string; label: string };

/** Title → slug, matching the schema's `^[a-z0-9]+(-[a-z0-9]+)*$`. */
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const BODY_HELP = `Blank line between paragraphs.
## Subheading
> Pull quote
- Bulleted line
1. Numbered line
**bold** and *italic* inline.`;

export default function PostEditor({
  post,
  categories,
  isNew,
}: {
  post: Post;
  categories: Category[];
  isNew: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Post>(post);
  // The slug the server should replace. Held from mount so renaming a post
  // updates the existing entry instead of adding a second one.
  const [originalSlug] = useState(isNew ? undefined : post.slug);
  const [slugLocked, setSlugLocked] = useState(!isNew);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const set = <K extends keyof Post>(key: K, value: Post[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onTitle = (title: string) => {
    setDraft((d) => ({ ...d, title, ...(slugLocked ? {} : { slug: slugify(title) }) }));
  };

  async function send(action: "save" | "delete") {
    setBusy(action);
    setError(null);
    setDone(null);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "delete"
            ? { action, original: originalSlug }
            : { action, original: originalSlug, post: cleanup(draft) },
        ),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Save failed.");
      if (action === "delete") {
        router.push("/admin/posts");
        return;
      }
      setDone(
        json.data?.driver === "github"
          ? "Committed. The live site rebuilds in about a minute."
          : "Saved to the local working tree.",
      );
      // Re-fetch so the list and any derived counts reflect the new state.
      router.refresh();
      if (isNew) router.replace(`/admin/posts/${draft.slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <header className="crm-head">
        <div>
          <p className="crm-label">{isNew ? "New post" : "Editing post"}</p>
          <h1>{draft.title || "Untitled"}</h1>
          <p className="crm-hint">
            <span className="crm-mono">/posts/{draft.slug || "…"}</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/admin/posts" className="crm-btn">
            Back
          </Link>
          {!isNew && (
            <a className="crm-btn" href={`/posts/${draft.slug}`} target="_blank" rel="noreferrer">
              View ↗
            </a>
          )}
        </div>
      </header>

      {error && (
        <div className="crm-note crm-note--bad" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      {done && (
        <div className="crm-note crm-note--ok" style={{ marginBottom: 16 }}>
          {done}
        </div>
      )}

      <div className="crm-grid crm-grid--2" style={{ alignItems: "start" }}>
        <section className="crm-card">
          <h2>The article</h2>
          <div style={{ marginTop: 14 }}>
            <label className="crm-field">
              <span className="crm-label">Title</span>
              <input className="crm-input" value={draft.title} onChange={(e) => onTitle(e.target.value)} />
            </label>

            <label className="crm-field">
              <span className="crm-label">Slug (the URL)</span>
              <input
                className="crm-input"
                value={draft.slug}
                onChange={(e) => {
                  setSlugLocked(true);
                  set("slug", slugify(e.target.value));
                }}
              />
              <span className="crm-hint">
                {slugLocked
                  ? "Set manually. Changing it changes the post's URL — old links will 404."
                  : "Following the title until you edit it."}
              </span>
            </label>

            <label className="crm-field">
              <span className="crm-label">Standfirst / excerpt</span>
              <textarea
                className="crm-textarea"
                value={draft.excerpt ?? ""}
                onChange={(e) => set("excerpt", e.target.value)}
                rows={3}
              />
              <span className="crm-hint">Shown on the index card and used as the page description for search.</span>
            </label>

            <label className="crm-field">
              <span className="crm-label">Body</span>
              <textarea
                className="crm-textarea crm-textarea--code"
                value={draft.body ?? ""}
                onChange={(e) => set("body", e.target.value)}
                rows={20}
              />
              <span className="crm-hint" style={{ whiteSpace: "pre-line" }}>
                {BODY_HELP}
              </span>
            </label>
          </div>
        </section>

        <div style={{ display: "grid", gap: 14 }}>
          <section className="crm-card">
            <h2>Publishing</h2>
            <div style={{ marginTop: 14 }}>
              <label className="crm-field">
                <span className="crm-label">Date</span>
                <input
                  className="crm-input"
                  type="date"
                  value={draft.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </label>
              <label className="crm-field">
                <span className="crm-label">Category</span>
                <select
                  className="crm-select"
                  value={draft.category ?? ""}
                  onChange={(e) => set("category", e.target.value || undefined)}
                >
                  <option value="">— none —</option>
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="crm-check" style={{ marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={!!draft.draft}
                  onChange={(e) => set("draft", e.target.checked || undefined)}
                />
                <span>
                  Draft
                  <span className="crm-hint">Hidden from the index and search, still reachable by its URL.</span>
                </span>
              </label>
            </div>
          </section>

          <section className="crm-card">
            <h2>Image &amp; credit</h2>
            <div style={{ marginTop: 14 }}>
              <label className="crm-field">
                <span className="crm-label">Cover image path</span>
                <input
                  className="crm-input"
                  value={draft.coverImage ?? ""}
                  onChange={(e) => set("coverImage", e.target.value || undefined)}
                  placeholder="/images/uploads/photograph.jpg"
                />
                <span className="crm-hint">
                  Copy a path from <Link href="/admin/media">Media</Link>.
                </span>
              </label>
              <label className="crm-field">
                <span className="crm-label">Image alt text</span>
                <input
                  className="crm-input"
                  value={draft.coverAlt ?? ""}
                  onChange={(e) => set("coverAlt", e.target.value || undefined)}
                />
                <span className="crm-hint">Describe what the photograph shows, for screen readers.</span>
              </label>
              {draft.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.coverImage}
                  alt=""
                  style={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid var(--edge)",
                  }}
                />
              )}
            </div>
          </section>

          <section className="crm-card">
            <h2>Original publication</h2>
            <div style={{ marginTop: 14 }}>
              <label className="crm-field">
                <span className="crm-label">Publication name</span>
                <input
                  className="crm-input"
                  value={draft.publication ?? ""}
                  onChange={(e) => set("publication", e.target.value || undefined)}
                  placeholder="Africa — African Youths in Conversation"
                />
              </label>
              <label className="crm-field">
                <span className="crm-label">Link to the original</span>
                <input
                  className="crm-input"
                  value={draft.externalUrl ?? ""}
                  onChange={(e) => set("externalUrl", e.target.value || undefined)}
                  placeholder="https://…"
                />
              </label>
              <label className="crm-field">
                <span className="crm-label">Tags</span>
                <input
                  className="crm-input"
                  value={(draft.tags ?? []).join(", ")}
                  onChange={(e) =>
                    set(
                      "tags",
                      e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="Green chemistry, Policy"
                />
                <span className="crm-hint">Comma separated.</span>
              </label>
            </div>
          </section>
        </div>
      </div>

      <div className="crm-actions">
        <button
          type="button"
          className="crm-btn crm-btn--primary"
          onClick={() => send("save")}
          disabled={busy !== null || !draft.title.trim() || !draft.slug.trim()}
        >
          {busy === "save" ? "Saving…" : isNew ? "Create post" : "Save changes"}
        </button>
        {!isNew && (
          <button
            type="button"
            className="crm-btn crm-btn--danger"
            disabled={busy !== null}
            onClick={() => {
              if (confirm(`Delete “${draft.title}”? This removes it from the site.`)) send("delete");
            }}
          >
            {busy === "delete" ? "Deleting…" : "Delete"}
          </button>
        )}
        <span className="crm-hint" style={{ marginLeft: "auto" }}>
          {draft.body ? `${draft.body.trim().split(/\s+/).length} words` : "No body yet"}
        </span>
      </div>
    </>
  );
}

/** Drop empty optional fields so the JSON artifact stays clean. */
function cleanup(post: Post): Post {
  const out: Post = { ...post };
  for (const key of ["excerpt", "category", "coverImage", "coverAlt", "publication", "externalUrl", "body"] as const) {
    if (!out[key] || String(out[key]).trim() === "") delete out[key];
  }
  if (!out.tags?.length) delete out.tags;
  if (!out.draft) delete out.draft;
  return out;
}
