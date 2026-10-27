import { storeStatus } from "@/lib/crm/store";
import { requireCrm } from "@/lib/crm/guard";
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
  // Not the access check (a navigation can render a page without its layout): every
  // page under here calls requireCrm() itself. This one keeps the shell from showing.
  await requireCrm();
  return (
    <AdminShell store={storeStatus()} siteName={site.name}>
      {children}
    </AdminShell>
  );
}
