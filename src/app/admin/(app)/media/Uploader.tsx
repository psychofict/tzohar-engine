"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Uploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ path: string; bytes: number } | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Upload failed.");
      setResult({ path: json.data.path, bytes: json.data.bytes });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="crm-card">
      <h2>Add an image</h2>
      <p className="crm-hint" style={{ marginTop: 6 }}>
        Photographs are rotated upright, resized to 2400px on the long edge and re-encoded, so a straight-off-the-phone
        file is safe to drop in.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 14 }}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="crm-input"
          style={{ maxWidth: 340 }}
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
        {busy && <span className="crm-hint">Uploading…</span>}
      </div>

      {error && (
        <div className="crm-note crm-note--bad" style={{ marginTop: 14 }}>
          {error}
        </div>
      )}
      {result && (
        <div className="crm-note crm-note--ok" style={{ marginTop: 14 }}>
          Uploaded ({(result.bytes / 1024).toFixed(0)}kB). Use this path:{" "}
          <span className="crm-mono">{result.path}</span>
        </div>
      )}
    </section>
  );
}
