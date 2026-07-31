import { notFound } from "next/navigation";
import { getComposedPage } from "@/data/pages";
import PageEditor from "../PageEditor";

export const dynamic = "force-dynamic";

export default async function EditComposedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getComposedPage(slug);
  if (!page) notFound();
  return <PageEditor page={page} />;
}
