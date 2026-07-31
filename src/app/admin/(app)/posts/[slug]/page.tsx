import { notFound } from "next/navigation";
import { getPost, postCategories } from "@/data/posts";
import PostEditor from "../PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  return <PostEditor post={post} categories={postCategories} isNew={false} />;
}
