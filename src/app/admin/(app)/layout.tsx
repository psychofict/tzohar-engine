import { redirect } from "next/navigation";
import { hasCrmSession } from "@/lib/crm/auth";
import { storeStatus } from "@/lib/crm/store";
import { requireModule } from "@/lib/modules";
import { site } from "@/config/site";
import AdminShell from "../AdminShell";

/**
 * Guard for every CRM page. A route group, so `(app)` adds nothing to the URL —
 * the dashboard is still `/admin` — while keeping `/admin/login` outside the
 * guard and therefore reachable when not signed in.
 */
export default async function AdminGuardedLayout({ children }: { children: React.ReactNode }) {
  // The CRM is a real login on a public host, so it exists only where the build
  // asked for it. Module-gated, not env-gated: whether the routes are reachable
  // is a config decision Studio publishes, separate from whether the
  // credentials that make them usable have been set on the deployment.
  requireModule("crm");
  if (!(await hasCrmSession())) redirect("/admin/login");
  return (
    <AdminShell store={storeStatus()} siteName={site.name}>
      {children}
    </AdminShell>
  );
}
