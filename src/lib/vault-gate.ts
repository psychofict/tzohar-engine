import type { DropType, VaultDrop } from "@/data/vault";
import { cloudinaryKeys, privateFileUrl, type CloudinaryKeys } from "@/lib/cloudinary";

/**
 * What one vault drop may show the visitor, decided on the server (security review TZS-2,
 * EBE-6325). A locked drop carries a position id, its type, date and tier and nothing else: no title,
 * description, button or link reaches a non-member's HTML or the page's scripts.
 */
export type VisibleDrop =
  | { locked: true; id: string; type: DropType; date: string; tier: "insider" }
  | {
      locked: false;
      id: string;
      type: DropType;
      date: string;
      tier: VaultDrop["tier"];
      title: string;
      description: string;
      cta?: string;
      href?: string;
    };

/** Seconds a member's signed link to a paid file stays valid. */
export const VAULT_FILE_TTL_SECONDS = 600;

export function visibleDrops(
  drops: readonly VaultDrop[],
  member: boolean,
  opts: { cloudinary?: CloudinaryKeys | null; now?: number } = {},
): VisibleDrop[] {
  const cloud = opts.cloudinary === undefined ? cloudinaryKeys() : opts.cloudinary;
  return drops.map((d, i): VisibleDrop => {
    if (d.tier !== "free" && !member) {
      // The id is by position: a drop's own id ("next-single-first-listen") describes it.
      return { locked: true, id: `locked-${i}`, type: d.type, date: d.date, tier: "insider" };
    }
    let href = d.href;
    if (d.file) {
      // A private file never falls back to `href`: no settings, no button.
      href = cloud ? privateFileUrl(cloud, d.file, { expiresInSeconds: VAULT_FILE_TTL_SECONDS, now: opts.now }) : undefined;
    }
    return {
      locked: false,
      id: d.id,
      type: d.type,
      date: d.date,
      tier: d.tier,
      title: d.title,
      description: d.description,
      ...(d.cta && href ? { cta: d.cta, href } : {}),
    };
  });
}
