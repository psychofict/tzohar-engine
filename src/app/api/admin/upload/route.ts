import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { refuseCrmRequest } from "@/lib/crm/guard";
import { CLOUDINARY_MAX_BYTES, cloudinaryConfig, uploadImage } from "@/lib/cloudinary";

/**
 * Image upload. Re-encodes rather than storing the original bytes, then stores the result
 * on Cloudinary (engine 2.8.7; until then it was committed into the site's repository).
 *
 * Three reasons for re-encoding, all of which have bitten this project's asset set already:
 * a phone photograph arrives at 6000px and 15MB and would be stored at that size; EXIF
 * orientation means it renders sideways unless baked in; and passing an uploaded file
 * through an image encoder is what guarantees the stored file really is an image rather
 * than something with a `.jpg` on the end.
 *
 * Without the Cloudinary settings (src/lib/cloudinary.ts) the route answers 501 and the
 * site still builds and runs; an image address can be pasted instead.
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
  const refused = refuseCrmRequest(req, { body: "multipart" });
  if (refused) return refused;

  const cfg = cloudinaryConfig();
  if (!cfg) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Image upload isn't set up on this site yet (it needs the Cloudinary settings). Paste an image address instead.",
      },
      { status: 501 },
    );
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
    // sharp throws at once on an empty buffer, so build it where that is the file's fault.
    let image: ReturnType<typeof sharp> | null = null;
    try {
      image = input.length ? sharp(input, { failOn: "none" }).rotate() : null;
    } catch {
      image = null;
    }
    const meta = image ? await image.metadata().catch(() => null) : null;
    if (!image || !meta?.width || !meta?.height) {
      return NextResponse.json({ success: false, error: "That file isn't a readable image." }, { status: 400 });
    }

    // A header that reads over data that does not decode (a truncated JPEG) is the file's fault.
    const out = await image
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true, progressive: true })
      .toBuffer()
      .catch(() => null);
    if (!out) {
      return NextResponse.json({ success: false, error: "That file isn't a readable image." }, { status: 400 });
    }
    if (out.length > CLOUDINARY_MAX_BYTES) {
      return NextResponse.json({ success: false, error: "That image is still over 10MB after resizing." }, { status: 413 });
    }

    // Timestamped so a re-upload of the same filename can't silently replace an
    // image other pages are already pointing at.
    const name = `${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}-${safeName(file.name)}`;
    const stored = await uploadImage(cfg, out, name, "image/jpeg");

    return NextResponse.json({
      success: true,
      data: { driver: "cloudinary", path: stored.url, bytes: stored.bytes },
    });
  } catch (err) {
    // Cloudinary's or sharp's own answer stays in the log (TZS-12).
    console.error("[crm] upload failed:", err);
    return NextResponse.json({ success: false, error: "The upload failed. Try again in a minute." }, { status: 502 });
  }
}
