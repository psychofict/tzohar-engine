"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { socials, heroes } from "@/data/artist";
import { site } from "@/config/site";
import { labelName } from "@/data/roster";

const linkItems = [
  {
    labelKey: "latestRelease",
    href: "https://open.spotify.com/artist/4mH71Zjiq36Q3SI7IZIBQK",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
      </svg>
    ),
  },
  {
    labelKey: "spotify",
    href: socials.find((s) => s.name === "Spotify")?.url || "#",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
  },
  {
    labelKey: "appleMusic",
    href: socials.find((s) => s.name === "Apple Music")?.url || "#",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.073-.005-.146-.01-.22-.015H5.988c-.076.005-.15.01-.225.015a10.56 10.56 0 00-1.564.15 5.022 5.022 0 00-1.877.726C1.204 1.744.46 2.744.143 4.054a9.233 9.233 0 00-.24 2.19L0 6.197v11.607l.003.073a9.23 9.23 0 00.24 2.19c.317 1.31 1.062 2.31 2.18 3.043a5.022 5.022 0 001.877.726c.513.09 1.034.14 1.564.15.073.004.146.01.22.014h12.024c.076-.005.15-.01.225-.015a10.56 10.56 0 001.564-.15 5.022 5.022 0 001.877-.726c1.118-.733 1.863-1.733 2.18-3.043a9.233 9.233 0 00.24-2.19l.003-.072V6.197l-.003-.073zm-6.694 4.507c0 .38-.005.76 0 1.14.01.5-.106.98-.35 1.426a2.178 2.178 0 01-1.01.9c-.376.17-.775.26-1.186.3-.33.03-.665.032-.99-.02a1.93 1.93 0 01-1.163-.6 1.628 1.628 0 01-.408-.91 1.58 1.58 0 01.245-1.095c.258-.374.623-.605 1.04-.748.338-.115.69-.177 1.04-.24.31-.056.62-.107.927-.175.136-.03.27-.07.378-.164a.44.44 0 00.15-.355c.003-.36.002-.722.002-1.083v-.092l-4.156.862v5.16c0 .4-.004.8.002 1.2.01.5-.106.983-.35 1.427a2.18 2.18 0 01-1.01.9c-.377.17-.776.26-1.187.3-.33.03-.665.03-.99-.02a1.93 1.93 0 01-1.164-.6 1.63 1.63 0 01-.407-.912 1.58 1.58 0 01.244-1.094c.258-.375.624-.606 1.04-.75.34-.114.69-.176 1.042-.238.31-.056.618-.108.926-.176.136-.03.27-.07.378-.164a.44.44 0 00.15-.354l.002-.527V7.674c0-.245.06-.468.217-.655.16-.19.37-.298.602-.35.13-.03.263-.05.395-.07l5.04-1.044c.088-.017.175-.04.264-.042.33-.008.54.2.54.533V10.63z" />
      </svg>
    ),
  },
  {
    labelKey: "instagram",
    href: socials.find((s) => s.name === "Instagram")?.url || "#",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    labelKey: "twitterX",
    href: socials.find((s) => s.name === "Twitter/X")?.url || "#",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    labelKey: "soundCloud",
    href: socials.find((s) => s.name === "SoundCloud")?.url || "#",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.057-.05-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.172 1.308c.013.06.045.094.104.094.057 0 .09-.037.104-.094l.194-1.308-.194-1.332c-.014-.057-.047-.094-.104-.094m1.81-.78c-.067 0-.12.056-.127.12l-.214 2.106.214 2.078c.007.065.06.12.127.12.065 0 .119-.055.128-.12l.241-2.078-.241-2.105c-.009-.065-.063-.12-.128-.12m.89-.2c-.078 0-.138.063-.145.14l-.193 2.306.193 2.156c.007.077.067.14.145.14.076 0 .138-.063.146-.14l.217-2.156-.217-2.306c-.008-.077-.07-.14-.146-.14m.9-.12c-.088 0-.155.072-.162.16l-.172 2.426.172 2.21c.007.088.074.16.162.16.086 0 .155-.072.163-.16l.193-2.21-.193-2.425c-.008-.088-.077-.16-.163-.16m.9-.077c-.098 0-.173.08-.18.18l-.152 2.503.152 2.255c.007.098.082.18.18.18.097 0 .172-.082.18-.18l.17-2.255-.17-2.504c-.008-.098-.083-.18-.18-.18m.9-.032c-.108 0-.191.09-.199.2l-.13 2.535.13 2.295c.008.108.09.2.199.2.107 0 .19-.09.198-.2l.147-2.295-.147-2.535c-.008-.11-.09-.2-.198-.2m1.078-.12c-.12 0-.21.098-.218.22l-.118 2.655.118 2.325c.008.12.098.218.218.218.118 0 .21-.098.219-.218l.13-2.325-.13-2.656c-.009-.12-.1-.22-.22-.22m.898.022c-.13 0-.228.108-.234.24l-.1 2.633.1 2.34c.006.13.104.24.234.24.128 0 .227-.11.234-.24l.112-2.34-.112-2.634c-.007-.13-.106-.24-.234-.24m1.094-.253c-.14 0-.25.116-.254.26l-.088 2.886.088 2.37c.004.14.114.26.254.26.138 0 .248-.12.254-.26l.098-2.37-.098-2.886c-.006-.144-.116-.26-.254-.26m.898-.098c-.15 0-.265.127-.27.28l-.068 2.984.068 2.39c.005.154.12.28.27.28.148 0 .264-.126.27-.28l.076-2.39-.076-2.984c-.006-.153-.122-.28-.27-.28m1.09-.14c-.16 0-.285.136-.29.3l-.05 3.124.05 2.407c.005.163.13.3.29.3.158 0 .283-.137.29-.3l.054-2.407-.055-3.125c-.006-.163-.132-.3-.29-.3m1.09.09c-.172 0-.303.146-.307.32l-.035 2.714.035 2.42c.004.172.135.32.307.32.17 0 .302-.148.308-.32l.038-2.42-.038-2.714c-.006-.174-.138-.32-.308-.32m1.458-.463c-.085 0-.17.01-.252.03a5.612 5.612 0 00-5.308-3.726c-.36 0-.718.04-1.068.115-.126.03-.16.06-.16.12v7.782c0 .063.04.12.11.127h6.678c1.27 0 2.3-1.03 2.3-2.3 0-1.27-1.03-2.148-2.3-2.148" />
      </svg>
    ),
  },
  {
    labelKey: "booking",
    href: "/contact",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    labelKey: "recordLabel",
    href: "/label",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

const buttonVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function LinksPage() {
  const t = useTranslations("links");
  const links = linkItems.map((item) => ({ ...item, label: t(item.labelKey as Parameters<typeof t>[0]) }));
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 pb-12 px-4">
      <div className="w-full max-w-md mx-auto">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-5 rounded-full overflow-hidden shadow-card border border-line">
            <Image
              src={heroes.links?.image ?? site.brand.ogImage}
              alt={heroes.links?.alt ?? site.name}
              width={112}
              height={112}
              className="w-full h-full object-cover object-[center_25%]"
            />
          </div>
          <h1 className="text-3xl font-bold text-ink tracking-tight">
            {site.name}
          </h1>
          <p className="text-sm text-ink-3 mt-2">{t("subtitle")}</p>
          <p className="text-[15px] text-ink-2 mt-4 leading-relaxed">{t("intro")}</p>
        </motion.div>

        <div className="space-y-3">
          {links.map((item, i) => (
            <motion.a
              key={item.labelKey}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3.5 w-full px-5 py-4 rounded-2xl bg-elevated border border-line text-ink hover:border-line-strong hover:shadow-card transition-all"
              custom={i}
              initial="hidden"
              animate="visible"
              variants={buttonVariant}
            >
              <span className="text-ocean shrink-0" aria-hidden="true">{item.icon}</span>
              <span className="font-medium text-[15px] flex-1">{item.label}</span>
              <svg className="w-4 h-4 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.a>
          ))}
        </div>

        <p className="text-center text-xs text-ink-3 mt-10">
          © {new Date().getFullYear()} {site.name}{labelName && labelName !== site.name ? ` · ${labelName}` : ""}
        </p>
      </div>
    </main>
  );
}
