import { site } from "@/config/site";

export interface MediaGroup {
  /** Repo-relative directory under `public/`. */
  dir: string;
  label: string;
  note?: string;
}

/**
 * Which `public/` directories the media library shows.
 *
 * `public/images/uploads` is always first and always present — it is the one
 * directory the CRM can write to, so it has to exist as a destination even on a
 * site that has no prepared asset pack. Everything after it comes from
 * `site.crm.mediaDirs`, because "the client's photographs live in
 * public/images/<their-slug>" is per-build knowledge: it was hardcoded to one
 * client's folder, which meant every other site's media library listed two
 * directories that didn't exist and none of the ones that did.
 */
export function mediaGroups(): MediaGroup[] {
  const uploads: MediaGroup = {
    dir: "public/images/uploads",
    label: "Your uploads",
    note: "Added through this CRM.",
  };
  const extra = (site.crm?.mediaDirs ?? []).filter((g) => g.dir !== uploads.dir);
  return [uploads, ...extra];
}
