"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Social = { name: string; url: string; icon: string };
type Values = {
  name: string;
  tagline: string;
  description: string;
  email: string;
  url: string;
  seoTitle: string;
  keywords: string[];
  socials: Social[];
  based: string;
  from: string;
};

export default function SettingsForm({ initial }: { initial: Values }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setV((p) => ({ ...p, [key]: value }));

  async function save() {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name,
          tagline: v.tagline || undefined,
          description: v.description,
          email: v.email || undefined,
          url: v.url,
          seo: { titleDefault: v.seoTitle, keywords: v.keywords },
          socials: v.socials.filter((s) => s.name && s.url),
          location: v.based || v.from ? { based: v.based || undefined, from: v.from || undefined } : undefined,
        }),
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

  return (
    <>
      <header className="crm-head">
        <div>
          <p className="crm-label">Site</p>
          <h1>Settings</h1>
          <p className="crm-hint">Identity, description and the links in the header and footer.</p>
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
          <h2>Identity</h2>
          <div style={{ marginTop: 14 }}>
            <label className="crm-field">
              <span className="crm-label">Site name</span>
              <input className="crm-input" value={v.name} onChange={(e) => set("name", e.target.value)} />
            </label>
            <label className="crm-field">
              <span className="crm-label">Tagline</span>
              <input className="crm-input" value={v.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </label>
            <label className="crm-field">
              <span className="crm-label">Description</span>
              <textarea
                className="crm-textarea"
                rows={4}
                value={v.description}
                onChange={(e) => set("description", e.target.value)}
              />
              <span className="crm-hint">Used as the site&apos;s default description in search results.</span>
            </label>
            <label className="crm-field">
              <span className="crm-label">Based in</span>
              <input className="crm-input" value={v.based} onChange={(e) => set("based", e.target.value)} />
            </label>
            <label className="crm-field">
              <span className="crm-label">From</span>
              <input className="crm-input" value={v.from} onChange={(e) => set("from", e.target.value)} />
            </label>
          </div>
        </section>

        <div style={{ display: "grid", gap: 14 }}>
          <section className="crm-card">
            <h2>Search &amp; contact</h2>
            <div style={{ marginTop: 14 }}>
              <label className="crm-field">
                <span className="crm-label">Default page title</span>
                <input className="crm-input" value={v.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
              </label>
              <label className="crm-field">
                <span className="crm-label">Keywords</span>
                <textarea
                  className="crm-textarea"
                  rows={4}
                  value={v.keywords.join(", ")}
                  onChange={(e) =>
                    set(
                      "keywords",
                      e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter(Boolean),
                    )
                  }
                />
                <span className="crm-hint">Comma separated.</span>
              </label>
              <label className="crm-field">
                <span className="crm-label">Contact email</span>
                <input className="crm-input" value={v.email} onChange={(e) => set("email", e.target.value)} />
              </label>
              <label className="crm-field">
                <span className="crm-label">Site URL</span>
                <input className="crm-input crm-mono" style={{ fontSize: 13 }} value={v.url} onChange={(e) => set("url", e.target.value)} />
                <span className="crm-hint">
                  Used to build canonical links. Changing this without moving the domain will break them.
                </span>
              </label>
            </div>
          </section>

          <section className="crm-card">
            <h2>Social links</h2>
            <p className="crm-hint" style={{ marginTop: 6 }}>
              The icon name must be one the site knows: Instagram, LinkedIn, Twitter/X, Facebook, Spotify, Apple Music,
              SoundCloud, IMDB, Wikipedia.
            </p>
            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              {v.socials.map((s, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "start" }}>
                  <input
                    className="crm-input"
                    value={s.name}
                    placeholder="Instagram"
                    onChange={(e) =>
                      set("socials", v.socials.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                    }
                  />
                  <input
                    className="crm-input crm-mono"
                    style={{ fontSize: 13 }}
                    value={s.url}
                    placeholder="https://instagram.com/…"
                    onChange={(e) =>
                      set("socials", v.socials.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
                    }
                  />
                  <button
                    type="button"
                    className="crm-btn crm-btn--sm crm-btn--danger"
                    onClick={() => set("socials", v.socials.filter((_, j) => j !== i))}
                    aria-label={`Remove ${s.name || "link"}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="crm-btn crm-btn--sm"
                onClick={() =>
                  set("socials", [...v.socials, { name: "Instagram", url: "", icon: "instagram" }])
                }
              >
                Add a link
              </button>
            </div>
          </section>
        </div>
      </div>

      <div className="crm-actions">
        <button type="button" className="crm-btn crm-btn--primary" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </button>
        <span className="crm-hint">
          Design choices — colours, fonts, which sections exist — are set in the build, not here.
        </span>
      </div>
    </>
  );
}
