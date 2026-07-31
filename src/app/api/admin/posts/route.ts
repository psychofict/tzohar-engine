import { NextResponse, type NextRequest } from "next/server";
import { postsSchema, type Post } from "@tzohar/schema";
import { hasCrmSession } from "@/lib/crm/auth";
import { readJson, writeFiles } from "@/lib/crm/store";

const FILE = "src/data/posts.json";

/**
 * Posts write API.
 *
 * Every mutation re-reads the file, applies one change and writes the whole
 * document back through the schema. That read-modify-write is deliberate: the
 * store's github driver commits against the current head, so working from the
 * freshly-read document keeps a save from clobbering an edit made in another tab
 * or by a separate `git push`.
 *
 * Validation happens on the way OUT, not just on the way in — an invalid
 * `posts.json` would break the public build, and a CMS must not be able to ship
 * a document the site cannot parse.
 */

type Body = {
  action: "save" | "delete";
  original?: string;
  post?: Post;
};

async function guard() {
  if (!(await hasCrmSession())) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, error: "Expected a JSON body." }, { status: 400 });
  }

  try {
    const doc = postsSchema.parse(await readJson(FILE));
    let posts = [...doc.posts];
    let message: string;

    if (body.action === "delete") {
      const slug = body.original;
      if (!slug) return NextResponse.json({ success: false, error: "No slug given." }, { status: 400 });
      const before = posts.length;
      posts = posts.filter((p) => p.slug !== slug);
      if (posts.length === before) {
        return NextResponse.json({ success: false, error: `No post with slug "${slug}".` }, { status: 404 });
      }
      message = `crm: delete post "${slug}"`;
    } else {
      const post = body.post;
      if (!post) return NextResponse.json({ success: false, error: "No post given." }, { status: 400 });

      // A rename must not silently create a duplicate.
      const clash = posts.find((p) => p.slug === post.slug && p.slug !== body.original);
      if (clash) {
        return NextResponse.json(
          { success: false, error: `Another post already uses the slug "${post.slug}".` },
          { status: 409 },
        );
      }

      const at = body.original ? posts.findIndex((p) => p.slug === body.original) : -1;
      if (at >= 0) {
        posts[at] = post;
        message = `crm: update post "${post.slug}"`;
      } else {
        posts.unshift(post);
        message = `crm: add post "${post.slug}"`;
      }
    }

    const next = postsSchema.parse({ ...doc, posts });
    const result = await writeFiles(
      [{ path: FILE, content: JSON.stringify(next, null, 2) + "\n" }],
      message,
    );
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}
