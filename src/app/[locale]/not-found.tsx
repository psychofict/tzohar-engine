import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import { ButtonLink } from "@/components/ui/Button";
import { routedPages } from "@/data/pages";
import { hasModule } from "@/config/site";

/*
 * A 404 is a navigation failure, so it should offer navigation. This page used
 * to be a nautical set-piece carried over from the reference build — "Lost at
 * sea", three floating accent circles, and a row of `∿∿∿∿∿∿∿` — animated with
 * `hero-gradient` and `animate-float` classes that no longer exist in
 * globals.css, so the blobs rendered as static colored discs. It also offered
 * exactly one destination.
 */
export default async function NotFound() {
  const t = await getTranslations("notFound");
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");
  const sections = hasModule("pages") ? routedPages.filter((p) => p.nav) : [];

  return (
    <main className="band flex min-h-[70svh] items-center">
      <Container size="xl">
        <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
          <div>
            <div className="mb-7 flex items-center gap-3.5">
              <span className="accent-rule" aria-hidden />
              <Eyebrow>404</Eyebrow>
              <span className="bg-line h-px flex-1" aria-hidden />
            </div>
            <h1 className="type-display text-ink text-balance leading-[1.08] text-[calc(clamp(2.25rem,5vw,3.75rem)*var(--display-scale))]">
              {t("title")}
            </h1>
            <p className="text-ink-2 measure mt-6 text-[17px] leading-relaxed">{t("pageGone")}</p>
            <ButtonLink href="/" className="mt-9">
              {tc("backHome")}
            </ButtonLink>
          </div>
          <nav aria-label={t("elsewhere")} className="border-line lg:border-l lg:pl-10">
            <p className="type-label text-ink-3 mb-4">{t("elsewhere")}</p>
            <ul className="border-line border-t">
              {[
                ...sections.map((p) => ({ href: `/${p.slug}`, label: p.nav!.label })),
                { href: "/about", label: tn("about") },
                { href: "/contact", label: tn("contact") },
              ].map((l) => (
                <li key={l.href} className="border-line border-b">
                  <Link
                    href={l.href as "/"}
                    className="text-ink-2 hover:text-ink block py-3.5 text-[15px] font-medium transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </main>
  );
}
