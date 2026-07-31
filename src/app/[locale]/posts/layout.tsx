import { requireModule } from "@/lib/modules";

export default function PostsLayout({ children }: { children: React.ReactNode }) {
  requireModule("posts");
  return children;
}
