import { listPublicDir } from "@/lib/crm/store";
import { mediaGroups } from "@/lib/crm/media";
import Uploader from "./Uploader";
import MediaGrid from "./MediaGrid";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const groups = await Promise.all(
    mediaGroups().map(async (g) => ({ ...g, files: await listPublicDir(g.dir) })),
  );

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
