import { redirect } from "next/navigation";
import { crmConfigStatus, hasCrmSession } from "@/lib/crm/auth";
import { requireModule } from "@/lib/modules";
import { site } from "@/config/site";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  requireModule("crm");
  if (await hasCrmSession()) redirect("/admin");
  const { next, error } = await searchParams;
  const config = crmConfigStatus();

  return (
    <div className="crm-login">
      <div className="crm-login-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <span className="crm-brand-mark" aria-hidden>
            {site.name.trim().charAt(0).toUpperCase() || "T"}
          </span>
          <div>
            <h1 style={{ fontSize: "1.15rem" }}>{site.name} CRM</h1>
            <p className="crm-label">Content management</p>
          </div>
        </div>

        {!config.ok ? (
          /*
            A missing env var is reported as exactly that. Without this the same
            situation presents as "wrong password" — `passwordIsValid` returns
            false when CRM_PASSWORD is unset — and that is a genuinely expensive
            thing to debug from the outside.
          */
          <div className="crm-note crm-note--bad">
            <strong>Not configured yet.</strong>
            <p style={{ marginTop: 6 }}>
              Missing: <span className="crm-mono">{config.missing.join(", ")}</span>. Set these in{" "}
              <span className="crm-mono">.env.local</span> for local use, and on the Vercel project for the live
              site. See <span className="crm-mono">docs/crm.md</span>.
            </p>
          </div>
        ) : (
          <LoginForm next={next} error={error} />
        )}
      </div>
    </div>
  );
}
