"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { PageBlock, SitePage } from "@tzohar/schema";

/*
 * PAGE EDITOR — a path-driven text editor over the block tree.
 *
 * There is deliberately no per-block-type form. There are 18 block types, several
 * nest arrays of items, and one (`tabs`) nests whole blocks inside itself; a
 * bespoke form per type would be ~18 forms to write and to keep in step with the
 * schema every time a field is added. Instead the editor WALKS each block, finds
 * every string leaf, and renders one control per leaf keyed by its path. Adding a
 * field to the schema makes it editable here for free.
 *
 * The trade-off is honest: this edits the words and the media paths of an existing
 * composition. It does not invent layout. Adding or removing sections, or changing
 * a section's type, stays a developer job — which is the right line for a tool
 * whose failure mode is a broken production build.
 */

/** Keys whose string values are prose the client will want to edit. */
const PROSE_KEYS = new Set([
  "eyebrow", "title", "heading", "description", "body", "sideNote", "caption", "text",
  "attribution", "role", "tagline", "label", "meta", "note", "credit", "summary",
  "quote", "quoteAttribution", "mediaCaption", "kicker", "tagsLabel", "linkLabel",
  "viewAllLabel", "filterAllLabel", "emptyNote", "period", "institution", "program",
  "location", "detail", "value", "fileName", "imageAlt", "alt", "mapImageAlt",
]);

/** Keys that point at a file or a URL rather than at prose. */
const REF_KEYS = new Set([
  "image", "imageLight", "src", "poster", "href", "linkUrl", "thumb", "media",
  "videoUrl", "video", "mapImage", "icon", "marker", "id", "doi", "featureImage",
]);

type Leaf = { path: (string | number)[]; key: string; value: string; kind: "prose" | "ref" };

function walk(node: unknown, path: (string | number)[], out: Leaf[]) {
  if (typeof node === "string") {
    const key = String(path[path.length - 1] ?? "");
    if (PROSE_KEYS.has(key)) out.push({ path, key, value: node, kind: "prose" });
    else if (REF_KEYS.has(key)) out.push({ path, key, value: node, kind: "ref" });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((child, i) => walk(child, [...path, i], out));
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      // `type` and `tone` are structural — handled by dedicated controls.
      if (k === "type" || k === "tone") continue;
      walk(v, [...path, k], out);
    }
  }
}

/** Immutable set-at-path, preserving arrays as arrays. */
function setAt<T>(root: T, path: (string | number)[], value: string): T {
  if (path.length === 0) return value as unknown as T;
  const [head, ...rest] = path;
  if (Array.isArray(root)) {
    const copy = [...root];
    copy[head as number] = setAt(copy[head as number], rest, value);
    return copy as unknown as T;
  }
  const obj = { ...(root as Record<string, unknown>) };
  obj[head as string] = setAt(obj[head as string], rest, value);
  return obj as T;
}

/** A human label for a leaf: "items › 2 › title". */
function pathLabel(path: (string | number)[]): string {
  return path
    .filter((p) => p !== "detail" || true)
    .map((p) => (typeof p === "number" ? String(p + 1) : p))
    .join(" › ");
}

/** One-line description of a block, for the collapsed row. */
function blockSummary(block: PageBlock): string {
  const b = block as Record<string, unknown>;
  const header = b.header as Record<string, unknown> | undefined;
  const candidates = [b.title, b.heading, header?.title, header?.eyebrow, b.eyebrow, b.text, b.caption];
  const found = candidates.find((c) => typeof c === "string" && c.trim());
  if (typeof found === "string") return found.replace(/\n/g, " ").slice(0, 90);
  const items = b.items as unknown[] | undefined;
  return items ? `${items.length} items` : "—";
}

const TONES = ["base", "muted", "deep", "invert"] as const;

export default function PageEditor({ page }: { page: SitePage }) {
  const router = useRouter();
  const [draft, setDraft] = useState<SitePage>(page);
  const [open, setOpen] = useState<number | null>(null);
  const [raw, setRaw] = useState<number | null>(null);
  const [rawText, setRawText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(page), [draft, page]);

  const updateBlock = (index: number, next: PageBlock) =>
    setDraft((d) => ({ ...d, blocks: d.blocks.map((b, i) => (i === index ? next : b)) }));

  const move = (index: number, delta: number) =>
    setDraft((d) => {
      const to = index + delta;
      if (to < 0 || to >= d.blocks.length) return d;
      const blocks = [...d.blocks];
      [blocks[index], blocks[to]] = [blocks[to], blocks[index]];
      return { ...d, blocks };
    });

  const remove = (index: number) =>
    setDraft((d) => ({ ...d, blocks: d.blocks.filter((_, i) => i !== index) }));

  const duplicate = (index: number) =>
    setDraft((d) => {
      const blocks = [...d.blocks];
      // Structured clone via JSON: blocks are plain data by contract.
      const copy = JSON.parse(JSON.stringify(blocks[index])) as PageBlock;
      // An id must stay unique — two sections with the same anchor break in-page links.
      if (copy.id) copy.id = `${copy.id}-copy`;
      blocks.splice(index + 1, 0, copy);
      return { ...d, blocks };
    });

  async function save() {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: page.slug, page: draft }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Save failed.");
      setDone(
        json.data?.driver === "github"
          ? "Committed. The live site rebuilds in about a minute."
          : "Saved to the local working tree.",
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  function applyRaw(index: number) {
    try {
      const parsed = JSON.parse(rawText) as PageBlock;
      if (!parsed || typeof parsed !== "object" || !("type" in parsed)) {
        throw new Error('A section must be an object with a "type".');
      }
      updateBlock(index, parsed);
      setRaw(null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? `Invalid JSON: ${e.message}` : "Invalid JSON.");
    }
  }

  return (
    <>
      <header className="crm-head">
        <div>
          <p className="crm-label">Editing page</p>
          <h1>{draft.title}</h1>
          <p className="crm-hint">
            <span className="crm-mono">{page.slug === "home" ? "/" : `/${page.slug}`}</span> · {draft.blocks.length}{" "}
            sections
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/admin/pages" className="crm-btn">
            Back
          </Link>
          <a
            className="crm-btn"
            href={page.slug === "home" ? "/" : `/${page.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            View ↗
          </a>
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

      <section className="crm-card" style={{ marginBottom: 22 }}>
        <h2>Page details</h2>
        <div className="crm-grid crm-grid--2" style={{ marginTop: 14 }}>
          <label className="crm-field">
            <span className="crm-label">Page title</span>
            <input
              className="crm-input"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </label>
          <label className="crm-field">
            <span className="crm-label">Menu label</span>
            <input
              className="crm-input"
              value={draft.nav?.label ?? ""}
              onChange={(e) =>
                setDraft((d) => (d.nav ? { ...d, nav: { ...d.nav, label: e.target.value } } : d))
              }
              disabled={!draft.nav}
              placeholder={draft.nav ? "" : "This page isn't in the menu"}
            />
          </label>
          {draft.nav && (
            <label className="crm-check" style={{ marginTop: 4 }}>
              <input
                type="checkbox"
                checked={draft.nav.inBar !== false}
                onChange={(e) =>
                  setDraft((d) =>
                    d.nav ? { ...d, nav: { ...d.nav, inBar: e.target.checked ? undefined : false } } : d,
                  )
                }
              />
              <span>
                A tab in the header
                <span className="crm-hint">
                  Off keeps the footer link and drops the tab. Three or four tabs is about as many as a
                  phone can carry.
                </span>
              </span>
            </label>
          )}
          <label className="crm-field">
            <span className="crm-label">Search-result title</span>
            <input
              className="crm-input"
              value={draft.seo?.title ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, seo: { ...d.seo, title: e.target.value } }))}
            />
          </label>
          <label className="crm-field">
            <span className="crm-label">Search-result description</span>
            <textarea
              className="crm-textarea"
              rows={2}
              value={draft.seo?.description ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, seo: { ...d.seo, description: e.target.value } }))}
            />
          </label>
        </div>
      </section>

      <h2 style={{ marginBottom: 12 }}>Sections</h2>
      {draft.blocks.map((block, i) => {
        const leaves: Leaf[] = [];
        walk(block, [], leaves);
        const prose = leaves.filter((l) => l.kind === "prose");
        const refs = leaves.filter((l) => l.kind === "ref");
        const isOpen = open === i;

        return (
          <div key={i} className="crm-block">
            <div
              className="crm-block-head"
              onClick={() => setOpen(isOpen ? null : i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen(isOpen ? null : i);
                }
              }}
              aria-expanded={isOpen}
            >
              <span className="crm-mono" style={{ fontSize: 11, color: "var(--ink-3)", width: 22, flex: "none" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="crm-block-type">{block.type}</span>
              <span style={{ minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {blockSummary(block)}
              </span>
              <span className="crm-pill">{block.tone ?? "base"}</span>
              <span style={{ display: "flex", gap: 4, flex: "none" }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="crm-btn crm-btn--sm"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="crm-btn crm-btn--sm"
                  onClick={() => move(i, 1)}
                  disabled={i === draft.blocks.length - 1}
                  aria-label="Move down"
                  title="Move down"
                >
                  ↓
                </button>
              </span>
              <span style={{ color: "var(--ink-3)", flex: "none" }} aria-hidden>
                {isOpen ? "▲" : "▼"}
              </span>
            </div>

            {isOpen && (
              <div className="crm-block-body">
                <div className="crm-grid crm-grid--2" style={{ marginTop: 12 }}>
                  <label className="crm-field">
                    <span className="crm-label">Background tone</span>
                    <select
                      className="crm-select"
                      value={block.tone ?? "base"}
                      onChange={(e) =>
                        updateBlock(i, { ...block, tone: e.target.value as (typeof TONES)[number] })
                      }
                    >
                      {TONES.map((t) => (
                        <option key={t} value={t}>
                          {t === "base"
                            ? "base — page background"
                            : t === "muted"
                              ? "muted — soft band"
                              : t === "deep"
                                ? "deep — stronger band"
                                : "invert — dark band (both modes)"}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {prose.length > 0 && (
                  <>
                    <p className="crm-label" style={{ marginTop: 10, marginBottom: 8 }}>
                      Text
                    </p>
                    {prose.map((leaf) => {
                      const long = leaf.value.length > 90 || leaf.value.includes("\n");
                      return (
                        <label className="crm-field" key={leaf.path.join(".")}>
                          <span className="crm-label">{pathLabel(leaf.path)}</span>
                          {long ? (
                            <textarea
                              className="crm-textarea"
                              rows={Math.min(10, Math.ceil(leaf.value.length / 90) + 1)}
                              value={leaf.value}
                              onChange={(e) => updateBlock(i, setAt(block, leaf.path, e.target.value))}
                            />
                          ) : (
                            <input
                              className="crm-input"
                              value={leaf.value}
                              onChange={(e) => updateBlock(i, setAt(block, leaf.path, e.target.value))}
                            />
                          )}
                        </label>
                      );
                    })}
                  </>
                )}

                {refs.length > 0 && (
                  <details style={{ marginTop: 8 }}>
                    <summary className="crm-label" style={{ cursor: "pointer", padding: "6px 0" }}>
                      Links, images &amp; icons ({refs.length})
                    </summary>
                    <p className="crm-hint" style={{ marginBottom: 10 }}>
                      Image and video paths come from <Link href="/admin/media">Media</Link>. Icon names come from the
                      site&apos;s icon set — an unknown name simply renders no icon.
                    </p>
                    {refs.map((leaf) => (
                      <label className="crm-field" key={leaf.path.join(".")}>
                        <span className="crm-label">{pathLabel(leaf.path)}</span>
                        <input
                          className="crm-input crm-mono"
                          style={{ fontSize: 13 }}
                          value={leaf.value}
                          onChange={(e) => updateBlock(i, setAt(block, leaf.path, e.target.value))}
                        />
                      </label>
                    ))}
                  </details>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                  <button
                    type="button"
                    className="crm-btn crm-btn--sm"
                    onClick={() => {
                      setRaw(raw === i ? null : i);
                      setRawText(JSON.stringify(block, null, 2));
                    }}
                  >
                    {raw === i ? "Close raw editor" : "Edit raw JSON"}
                  </button>
                  <button type="button" className="crm-btn crm-btn--sm" onClick={() => duplicate(i)}>
                    Duplicate section
                  </button>
                  <button
                    type="button"
                    className="crm-btn crm-btn--sm crm-btn--danger"
                    onClick={() => {
                      if (confirm(`Remove section ${i + 1} (${block.type})?`)) remove(i);
                    }}
                  >
                    Remove section
                  </button>
                </div>

                {raw === i && (
                  <div style={{ marginTop: 12 }}>
                    <textarea
                      className="crm-textarea crm-textarea--code"
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      spellCheck={false}
                    />
                    <p className="crm-hint">
                      The escape hatch for anything the fields above don&apos;t cover. Invalid JSON, or a shape the
                      site&apos;s contract rejects, is refused on save rather than published.
                    </p>
                    <button type="button" className="crm-btn crm-btn--sm" onClick={() => applyRaw(i)} style={{ marginTop: 8 }}>
                      Apply to section
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="crm-actions">
        <button type="button" className="crm-btn crm-btn--primary" onClick={save} disabled={busy || !dirty}>
          {busy ? "Saving…" : dirty ? "Save changes" : "No changes"}
        </button>
        <button
          type="button"
          className="crm-btn"
          disabled={busy || !dirty}
          onClick={() => {
            if (confirm("Discard your unsaved changes to this page?")) setDraft(page);
          }}
        >
          Discard changes
        </button>
      </div>
    </>
  );
}
