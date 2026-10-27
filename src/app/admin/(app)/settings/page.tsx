import { site } from "@/config/site";
import SettingsForm from "./SettingsForm";
import { requireCrm } from "@/lib/crm/guard";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireCrm();
  return (
    <SettingsForm
      initial={{
        name: site.name,
        tagline: site.tagline ?? "",
        description: site.description,
        email: site.email ?? "",
        url: site.url,
        seoTitle: site.seo.titleDefault,
        keywords: site.seo.keywords ?? [],
        socials: site.socials.map((s) => ({ name: s.name, url: s.url, icon: s.icon })),
        based: site.location?.based ?? "",
        from: site.location?.from ?? "",
      }}
    />
  );
}
