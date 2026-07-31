import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { hasCrmSession } from "@/lib/crm/auth";
import { writeFiles } from "@/lib/crm/store";

/**
 * Image upload. Re-encodes rather than storing the original bytes.
 *
 * Three reasons, all of which have bitten this project's asset set already:
 * a phone photograph arrives at 6000px and 15MB and would be committed at that
 * size; EXIF orientation means it renders sideways unless baked in; and passing
 * an uploaded file through an image encoder is what guarantees the committed file
 * really is an image rather than something with a `.jpg` on the end.
 */

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_EDGE = 2400;

function safeName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "upload";
}

export async function POST(req: NextRequest) {
  if (!(await hasCrmSession())) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "No file received." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { success: false, error: `That file is ${(file.size / 1e6).toFixed(1)}MB; the limit is 25MB.` },
      { status: 413 },
    );
  }

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const image = sharp(input, { failOn: "none" }).rotate();
    const meta = await image.metadata();
    if (!meta.width || !meta.height) throw new Error("That file isn't a readable image.");

    const out = await image
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true, progressive: true })
      .toBuffer();

    // Timestamped so a re-upload of the same filename can't silently replace an
    // image other pages are already pointing at.
    const stamp = new Date().toISOString().slice(0, 10);
    const name = `${stamp}-${safeName(file.name)}.jpg`;
    const repoPath = `public/images/uploads/${name}`;

    const result = await writeFiles(
      [{ path: repoPath, content: out.toString("base64"), encoding: "base64" }],
      `crm: upload ${name}`,
    );

    return NextResponse.json({
      success: true,
      data: { ...result, path: `/images/uploads/${name}`, bytes: out.length },
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}
