import PageHero from "@/components/ui/PageHero";
import GalleryView from "@/components/GalleryView";
import GalleryGate from "@/components/GalleryGate";
import { getTranslations } from "next-intl/server";
import { getServerMembership } from "@/lib/membership-server";
import { getBlurDataURL } from "@/lib/image-blur";
import { galleryBlurDataURL } from "@/data/gallery-blur";
import { galleryItems, galleryCategories, galleryVideos } from "@/data/gallery";
import { heroes } from "@/data/artist";

/*
 * Members-only on the server (security review TZS-2, EBE-6325). Until engine 2.8.11 this page
 * was a client component that shipped every photo, caption and video to every visitor and
 * blurred them for non-members. The hub is asked here now; a non-member's page carries the
 * photo count and twelve blur placeholders, and the photos only reach a paid member.
 *
 * Photos kept in public/ are still public by address: the gate stops the page from naming
 * them, not a visitor who already has the address. Sell files from the vault's private `file`.
 */
export const dynamic = "force-dynamic";

const blurOf = (src: string) => galleryBlurDataURL(src) ?? getBlurDataURL(src);

export default async function GalleryPage() {
  const t = await getTranslations("gallery");
  const { member } = await getServerMembership();

  return (
    <main id="main-content" className="min-h-screen bg-bg text-ink">
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        backgroundImage={heroes.gallery?.image}
        backgroundAlt={heroes.gallery?.alt}
        imagePosition="center 30%"
      />

      {member ? (
        <GalleryView
          items={galleryItems.map((item) => ({ ...item, blur: blurOf(item.src) }))}
          categories={galleryCategories}
          videos={galleryVideos}
        />
      ) : (
        <GalleryGate
          count={galleryItems.length}
          previews={galleryItems.slice(0, 12).map((item) => ({ w: item.w, h: item.h, blur: blurOf(item.src) }))}
        />
      )}
    </main>
  );
}
