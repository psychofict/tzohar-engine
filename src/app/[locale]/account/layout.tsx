import type { Metadata } from "next";
import { requireModule } from "@/lib/modules";
import { site } from "@/config/site";

// Private page — never index it.
export const metadata: Metadata = {
  title: `Your account — ${site.name}`,
  description: `Manage your ${site.name} membership and preferences.`,
  robots: { index: false, follow: false },
};
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  requireModule("membership");
  return <>{children}</>;
}
