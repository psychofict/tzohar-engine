"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Check } from "lucide-react";

interface Prefs {
  displayName?: string;
  notify?: { releases?: boolean; tour?: boolean; drops?: boolean };
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="text-[15px] text-ink-2">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-ocean" : "bg-surface-2"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
        />
      </button>
    </label>
  );
}

// Editable, persistent account profile — saved to the hub's per-product KV via the
// same-origin /api/account/profile proxy (cookie-authed).
export default function AccountProfileForm({ fallbackName }: { fallbackName?: string | null }) {
  const t = useTranslations("account");
  const [displayName, setDisplayName] = useState("");
  const [releases, setReleases] = useState(true);
  const [tour, setTour] = useState(true);
  const [drops, setDrops] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/profile", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Prefs | null) => {
        if (cancelled) return;
        setDisplayName(d?.displayName ?? fallbackName ?? "");
        setReleases(d?.notify?.releases ?? true);
        setTour(d?.notify?.tour ?? true);
        setDrops(d?.notify?.drops ?? true);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setDisplayName(fallbackName ?? "");
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [fallbackName]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim(), notify: { releases, tour, drops } }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || t("saveError"));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="rounded-2xl border border-line bg-elevated p-6">
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3">{t("profile")}</h2>

      <label htmlFor="displayName" className="mb-2 block text-sm font-semibold text-ink">
        {t("displayName")}
      </label>
      <input
        id="displayName"
        type="text"
        value={displayName}
        disabled={!loaded}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder={t("displayNamePlaceholder")}
        className="h-11 w-full rounded-xl border border-line bg-bg px-4 text-[15px] text-ink placeholder:text-ink-3 focus:border-ocean focus:outline-none disabled:opacity-60"
      />

      <p className="mb-3 mt-6 text-sm font-semibold text-ink">{t("notifications")}</p>
      <div className="flex flex-col gap-3.5">
        <Toggle label={t("notifyReleases")} checked={releases} onChange={setReleases} />
        <Toggle label={t("notifyTour")} checked={tour} onChange={setTour} />
        <Toggle label={t("notifyDrops")} checked={drops} onChange={setDrops} />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !loaded}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ocean px-6 text-[15px] font-semibold text-on-accent hover:bg-ocean-strong transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saved && !saving && <Check size={16} />}
          {saved ? t("saved") : t("save")}
        </button>
        {error && <span className="text-sm text-magenta">{error}</span>}
      </div>
    </form>
  );
}
