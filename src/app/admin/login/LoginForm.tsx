"use client";

import { useState } from "react";

export default function LoginForm({ next, error }: { next?: string; error?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      action="/api/admin/login"
      method="post"
      onSubmit={() => setBusy(true)}
      className="crm-card"
    >
      <input type="hidden" name="next" value={next ?? "/admin"} />
      <label className="crm-field">
        <span className="crm-label">Password</span>
        <input
          className="crm-input"
          type="password"
          name="password"
          autoComplete="current-password"
          autoFocus
          required
        />
      </label>
      {error && (
        <div className="crm-note crm-note--bad" style={{ marginBottom: 14 }}>
          That password wasn&apos;t right.
        </div>
      )}
      <button type="submit" className="crm-btn crm-btn--primary" disabled={busy} style={{ width: "100%" }}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
