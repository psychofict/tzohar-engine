import type { Metadata } from "next";
import { requireModule } from "@/lib/modules";
import { site } from "@/config/site";
import { clampDescription, fitTitle } from "@/lib/route-meta";

// Private page — never index it.
export const metadata: Metadata = {
  title: fitTitle(`Your account — ${site.name}`, site.name),
  description: clampDescription(`Manage your ${site.name} membership and preferences.`),
  robots: { index: false, follow: false },
};
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  requireModule("membership");
  return <>{children}</>;
}
