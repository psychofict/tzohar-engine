import { listPublicDir } from "@/lib/crm/store";
import { mediaGroups } from "@/lib/crm/media";
import { cloudinaryConfig, listFolder } from "@/lib/cloudinary";
import Uploader from "./Uploader";
import MediaGrid from "./MediaGrid";
import { requireCrm } from "@/lib/crm/guard";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  await requireCrm();
  // Since engine 2.8.7 uploads go to Cloudinary when it is configured; the repository's
  // uploads folder then only holds what was added before, and is hidden while empty.
  const cloud = cloudinaryConfig();
  const uploaded = cloud ? await listFolder(cloud) : null;
  const groups = (
    await Promise.all(
      mediaGroups().map(async (g) => ({ ...g, files: await listPublicDir(g.dir) })),
    )
  )
    .map((g) =>
      cloud && g.dir === "public/images/uploads"
        ? { ...g, label: "Earlier uploads", note: "Added before uploads moved to Cloudinary." }
        : g,
    )
    .filter((g) => !(cloud && g.dir === "public/images/uploads" && g.files.length === 0));

  return (
    <>
      <header className="crm-head">
        <div>
          <p className="crm-label">Content</p>
          <h1>Media</h1>
          <p className="crm-hint">
            Copy a path from here into a post&apos;s cover image or a page section.
          </p>
        </div>
      </header>

      <Uploader />

      {uploaded && (
        <section style={{ marginTop: 26 }}>
          <h2>Your uploads</h2>
          <p className="crm-hint" style={{ marginBottom: 12 }}>
            Added through this CRM · {uploaded.length} file{uploaded.length === 1 ? "" : "s"}
          </p>
          {uploaded.length === 0 ? <div className="crm-note">Nothing here yet.</div> : <MediaGrid files={uploaded} />}
        </section>
      )}

      {groups.map((group) => (
        <section key={group.dir} style={{ marginTop: 26 }}>
          <h2>{group.label}</h2>
          <p className="crm-hint" style={{ marginBottom: 12 }}>
            {group.note} · {group.files.length} file{group.files.length === 1 ? "" : "s"}
          </p>
          {group.files.length === 0 ? (
            <div className="crm-note">Nothing here yet.</div>
          ) : (
            <MediaGrid
              files={group.files.map((f) => ({
                // public/ is the web root — strip it to get the usable path.
                path: "/" + f.path.replace(/^public\//, ""),
                size: f.size,
              }))}
            />
          )}
        </section>
      ))}
    </>
  );
}
