import { postCategories } from "@/data/posts";
import PostEditor from "../PostEditor";

export const dynamic = "force-dynamic";

/** Today in ISO, computed on the server so it matches the deploy's clock. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewPostPage() {
  return (
    <PostEditor
      isNew
      categories={postCategories}
      post={{ slug: "", title: "", date: today(), category: postCategories[0]?.key, draft: true }}
    />
  );
}
