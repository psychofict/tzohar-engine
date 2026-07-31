"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { site } from "@/config/site";
import { useFormSubmit } from "@/lib/useFormSubmit";
import FormFeedback from "@/components/FormFeedback";
import JsonLd from "@/components/JsonLd";
import { getFAQSchema } from "@/lib/structured-data";
import PageHero from "@/components/ui/PageHero";

/**
 * Every inquiry type the engine can render. WHICH of them a site shows is a
 * per-client decision (`site.contact.inquiries`), not a component one — a
 * musician wants Booking + Demo submissions, an academic wants Speaking +
 * Research, and both were previously achieved by editing this file, which is
 * exactly the hardcoding the config layer exists to prevent.
 *
 * `speaking` and `booking` share a form (an event enquiry either way), as do
 * `research` and `collaborations`; only the label and the `type` sent to
 * /api/contact differ.
 */
const ALL_INQUIRIES = ["booking", "speaking", "press", "collaborations", "research", "labelSubmissions", "general"] as const;
type TabType = (typeof ALL_INQUIRIES)[number];

/**
 * Which tabs this build shows.
 *
 * Two filters, and the second one is load-bearing. `site.contact.inquiries`
 * narrows the list when a build has an opinion; what survives is then filtered
 * to the tabs whose LABEL ACTUALLY EXISTS in this site's messages.
 *
 * That second filter exists because next-intl throws on a missing key, and a
 * client's `messages/<locale>.json` is client-owned content — real builds trim
 * it to the keys they use. Shipping an engine release whose default tab list
 * named a key some client had trimmed would take that client's contact page
 * down at prerender, on a deploy that changed none of their content. Caught
 * exactly that way against a live site before it shipped.
 *
 * So with no config, a site offers every inquiry type it has copy for — which
 * reproduces each existing build's behaviour without any of them having to
 * declare it.
 */
function useInquiryTabs(t: { has: (key: string) => boolean }): TabType[] {
  const configured = site.contact?.inquiries as TabType[] | undefined;
  const candidates: TabType[] = configured
    ? configured.filter((k) => (ALL_INQUIRIES as readonly string[]).includes(k))
    : [...ALL_INQUIRIES];
  const withCopy = candidates.filter((k) => t.has(k));
  // `general` is in every messages file the engine has ever shipped, so it is
  // the one safe floor when a config and a messages file disagree completely.
  return withCopy.length > 0 ? withCopy : ["general"];
}

const inputClass =
  "w-full px-3 sm:px-4 py-3 rounded-[var(--radius-card)] bg-surface border border-line text-ink text-base placeholder-ink-3 focus:outline-none focus:border-ocean focus:ring-1 focus:ring-ocean transition-colors";
const labelClass = "block text-sm text-ink-2 mb-2";
const btnBase =
  // text-on-accent, not text-white: the accent is client-configurable, and a
  // light one (this site's gold) puts white text at ~2:1 on its own button.
  "w-full py-3 rounded-[var(--radius-card)] bg-ocean shadow-lg shadow-ocean/20 text-on-accent font-semibold hover:bg-ocean-strong transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

function EventForm({ type }: { type: "booking" | "speaking" }) {
  const t = useTranslations("contact");
  const [form, setForm] = useState({
    name: "", email: "", eventType: "", date: "", location: "", message: "",
  });
  const { loading, success, error, submitForm, reset } = useFormSubmit("/api/contact");
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm({ type, ...form });
    if (!error) setForm({ name: "", email: "", eventType: "", date: "", location: "", message: "" });
  };
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className={labelClass}>{t("name")}</label>
          <input id="name" name="name" value={form.name} onChange={onChange} required className={inputClass} placeholder={t("yourName")} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>{t("email")}</label>
          <input id="email" name="email" type="email" value={form.email} onChange={onChange} required className={inputClass} placeholder={t("youAtExample")} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="eventType" className={labelClass}>{t("eventType")}</label>
          <input id="eventType" name="eventType" value={form.eventType} onChange={onChange} className={inputClass} placeholder={t("eventTypePlaceholder")} />
        </div>
        <div>
          <label htmlFor="date" className={labelClass}>{t("date")}</label>
          <input id="date" name="date" type="date" value={form.date} onChange={onChange} min={new Date().toISOString().slice(0, 10)} className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="location" className={labelClass}>{t("location")}</label>
        <input id="location" name="location" value={form.location} onChange={onChange} className={inputClass} placeholder={t("cityVenue")} />
      </div>
      <div>
        <label htmlFor="message" className={labelClass}>{t("message")}</label>
        <textarea id="message" name="message" value={form.message} onChange={onChange} rows={4} className={`${inputClass} resize-none`} placeholder={t("tellAboutEvent")} />
      </div>
      <button type="submit" disabled={loading} className={btnBase}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {t("submitBooking")}
      </button>
      <FormFeedback loading={false} success={success} error={error} successMessage={t("bookingSuccess")} reset={reset} />
    </form>
  );
}

function PressForm() {
  const t = useTranslations("contact");
  const [form, setForm] = useState({ outlet: "", email: "", deadline: "", topic: "" });
  const { loading, success, error, submitForm, reset } = useFormSubmit("/api/contact");
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm({ type: "press", name: form.outlet, email: form.email, message: form.topic, deadline: form.deadline });
    if (!error) setForm({ outlet: "", email: "", deadline: "", topic: "" });
  };
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="outlet" className={labelClass}>{t("outletName")}</label>
          <input id="outlet" name="outlet" value={form.outlet} onChange={onChange} required className={inputClass} placeholder={t("publicationOutlet")} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>{t("email")}</label>
          <input id="email" name="email" type="email" value={form.email} onChange={onChange} required className={inputClass} placeholder={t("youAtOutlet")} />
        </div>
      </div>
      <div>
        <label htmlFor="deadline" className={labelClass}>{t("deadline")}</label>
        <input id="deadline" name="deadline" type="date" value={form.deadline} onChange={onChange} min={new Date().toISOString().slice(0, 10)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="topic" className={labelClass}>{t("topic")}</label>
        <textarea id="topic" name="topic" value={form.topic} onChange={onChange} rows={4} required className={`${inputClass} resize-none`} placeholder={t("whatCover")} />
      </div>
      <button type="submit" disabled={loading} className={btnBase}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {t("submitPress")}
      </button>
      <FormFeedback loading={false} success={success} error={error} successMessage={t("pressSuccess")} reset={reset} />
    </form>
  );
}

function CollaborationForm({ type }: { type: "collaborations" | "research" }) {
  const t = useTranslations("contact");
  const [form, setForm] = useState({ name: "", email: "", collabType: "", links: "", message: "" });
  const { loading, success, error, submitForm, reset } = useFormSubmit("/api/contact");
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm({ type: type === "research" ? "research" : "collaboration", ...form });
    if (!error) setForm({ name: "", email: "", collabType: "", links: "", message: "" });
  };
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className={labelClass}>{type === "research" ? t("institutionName") : t("name")}</label>
          <input id="name" name="name" value={form.name} onChange={onChange} required className={inputClass} placeholder={type === "research" ? t("nameOrInstitution") : t("yourName")} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>{t("email")}</label>
          <input id="email" name="email" type="email" value={form.email} onChange={onChange} required className={inputClass} placeholder={t("youAtExample")} />
        </div>
      </div>
      <div>
        <label htmlFor="collabType" className={labelClass}>{t("collaborationType")}</label>
        <input id="collabType" name="collabType" value={form.collabType} onChange={onChange} className={inputClass} placeholder={t("collabTypePlaceholder")} />
      </div>
      <div>
        <label htmlFor="links" className={labelClass}>{t("links")}</label>
        <input id="links" name="links" value={form.links} onChange={onChange} className={inputClass} placeholder={t("portfolioLinks")} />
      </div>
      <div>
        <label htmlFor="message" className={labelClass}>{t("message")}</label>
        <textarea id="message" name="message" value={form.message} onChange={onChange} rows={4} className={`${inputClass} resize-none`} placeholder={t("tellAboutCollab")} />
      </div>
      <button type="submit" disabled={loading} className={btnBase}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {t("submitCollab")}
      </button>
      <FormFeedback loading={false} success={success} error={error} successMessage={t("collabSuccess")} reset={reset} />
    </form>
  );
}

function GeneralForm() {
  const t = useTranslations("contact");
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const { loading, success, error, submitForm, reset } = useFormSubmit("/api/contact");
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm({ type: "general", ...form });
    if (!error) setForm({ name: "", email: "", message: "" });
  };
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className={labelClass}>{t("name")}</label>
          <input id="name" name="name" value={form.name} onChange={onChange} required className={inputClass} placeholder={t("yourName")} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>{t("email")}</label>
          <input id="email" name="email" type="email" value={form.email} onChange={onChange} required className={inputClass} placeholder={t("youAtExample")} />
        </div>
      </div>
      <div>
        <label htmlFor="message" className={labelClass}>{t("message")}</label>
        <textarea id="message" name="message" value={form.message} onChange={onChange} rows={5} required className={`${inputClass} resize-none`} placeholder={t("whatsOnMind")} />
      </div>
      <button type="submit" disabled={loading} className={btnBase}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {t("sendMessage")}
      </button>
      <FormFeedback loading={false} success={success} error={error} successMessage={t("generalSuccess")} reset={reset} />
    </form>
  );
}

function LabelSubmissionsForm() {
  const t = useTranslations("contact");
  const [form, setForm] = useState({ artistName: "", email: "", genre: "", musicLinks: "", message: "" });
  const { loading, success, error, submitForm, reset } = useFormSubmit("/api/contact");
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm({ type: "label", ...form });
    if (!error) setForm({ artistName: "", email: "", genre: "", musicLinks: "", message: "" });
  };
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="artistName" className={labelClass}>{t("artistName")}</label>
          <input id="artistName" name="artistName" value={form.artistName} onChange={onChange} required className={inputClass} placeholder={t("stageName")} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>{t("email")}</label>
          <input id="email" name="email" type="email" value={form.email} onChange={onChange} required className={inputClass} placeholder={t("youAtExample")} />
        </div>
      </div>
      <div>
        <label htmlFor="genre" className={labelClass}>{t("genre")}</label>
        <input id="genre" name="genre" value={form.genre} onChange={onChange} required className={inputClass} placeholder={t("genrePlaceholder")} />
      </div>
      <div>
        <label htmlFor="musicLinks" className={labelClass}>{t("linksToMusic")}</label>
        <input id="musicLinks" name="musicLinks" value={form.musicLinks} onChange={onChange} required className={inputClass} placeholder={t("musicLinksPlaceholder")} />
      </div>
      <div>
        <label htmlFor="message" className={labelClass}>{t("message")}</label>
        <textarea id="message" name="message" value={form.message} onChange={onChange} rows={4} className={`${inputClass} resize-none`} placeholder={t("tellAboutMusic")} />
      </div>
      <button type="submit" disabled={loading} className={btnBase}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {t("submitDemo")}
      </button>
      <FormFeedback loading={false} success={success} error={error} successMessage={t("demoSuccess")} reset={reset} />
    </form>
  );
}

const formComponents: Record<TabType, React.FC> = {
  booking: () => <EventForm type="booking" />,
  speaking: () => <EventForm type="speaking" />,
  press: PressForm,
  collaborations: () => <CollaborationForm type="collaborations" />,
  research: () => <CollaborationForm type="research" />,
  labelSubmissions: LabelSubmissionsForm,
  general: GeneralForm,
};

export default function ContactPage() {
  const t = useTranslations("contact");
  const tc = useTranslations("common");
  const heroImage = site.brand.heroImage ?? site.brand.ogImage;
  const tabKeys = useInquiryTabs(t);
  const [activeTab, setActiveTab] = useState<TabType>(tabKeys[0]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as TabType;
    // The URL hash is client-only, so it can't seed useState without a hydration
    // mismatch — syncing it once on mount is the correct pattern here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tabKeys.includes(hash)) setActiveTab(hash);
  }, []);

  const ActiveForm = formComponents[activeTab];

  const faqs = [
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
    { question: t("faq4Q"), answer: t("faq4A") },
  ];

  return (
    <main id="main-content" className="min-h-screen">
      <JsonLd data={getFAQSchema(faqs)} />
      <PageHero
        eyebrow={t("contactLabel")}
        title={t("title")}
        subtitle={t("subtitle")}
        accent="ocean"
        backgroundImage={heroImage}
        backgroundImageLight={site.brand.heroImageLight}
        backgroundAlt={site.name}
        imagePosition="74% 16%"
        /*
         * The dark plate's crop is tuned for a portrait; the light plate is a
         * different photograph, so it takes the frame's own centre rather than
         * inheriting a number chosen for another image.
         */
        imagePositionLight="center"
      />

      {/* Intro */}
      <section className="bg-bg">
        <div className="max-w-6xl mx-auto px-6 pt-12 md:pt-16">
          <p className="measure text-base md:text-lg text-ink-2 leading-relaxed">
            {t("intro")}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-bg">
        <div className="max-w-6xl mx-auto px-6 pb-12 md:pb-24 pt-8 md:pt-12">
          <div className="grid lg:grid-cols-[1fr_320px] gap-8 lg:gap-12">
            {/* Mobile quick contact bar */}
            <div className="lg:hidden flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] bg-surface p-4">
              <a href={`mailto:${site.email}`} className="flex-1 text-center text-sm font-medium text-ink-2 hover:text-ink py-2 rounded-[calc(var(--radius-card)*0.6)] bg-ink/5">
                {site.email}
              </a>
              <span className="type-label text-ink-3">{t("seoulKorea")}</span>
            </div>

            {/* Form Column */}
            <div>
              {/* Tab Selector — dropdown on mobile, pills on sm+ */}
              <motion.div
                className="mb-6 md:mb-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                {/* Mobile dropdown */}
                <select
                  className="sm:hidden w-full px-4 py-3 rounded-[var(--radius-card)] bg-surface border border-line text-ink text-sm font-medium focus:outline-none focus:border-ocean focus:ring-1 focus:ring-ocean"
                  value={activeTab}
                  onChange={(e) => { const v = e.target.value as TabType; setActiveTab(v); window.history.replaceState(null, "", `#${v}`); }}
                >
                  {tabKeys.map((tab) => (
                    <option key={tab} value={tab}>{t(tab)}</option>
                  ))}
                </select>
                {/* Desktop pills */}
                <div className="hidden sm:flex overflow-x-auto scrollbar-hide snap-x gap-2 pb-2">
                  {tabKeys.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => { setActiveTab(tab); window.history.replaceState(null, "", `#${tab}`); }}
                      className={`px-5 py-2 rounded-[var(--radius-pill)] text-sm font-medium transition-all duration-300 cursor-pointer whitespace-nowrap snap-start ${
                        activeTab === tab
                          ? "bg-ocean text-on-accent shadow-lg"
                          : "bg-surface text-ink-2 hover:bg-surface/70 hover:text-ink"
                      }`}
                    >
                      {t(tab)}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Active Form */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-[var(--radius-card)] border border-line-strong bg-elevated p-5 sm:p-8"
                >
                  <h2 className="text-xl font-semibold mb-6 text-ink">{t(activeTab)}</h2>
                  <ActiveForm />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sidebar */}
            <motion.aside
              className="space-y-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {/* Email */}
              <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
                <p className="type-label text-ink-3 mb-3">{t("emailSidebar")}</p>
                <a
                  href={`mailto:${site.email}`}
                  className="text-on-dark/80 hover:text-ocean transition-colors text-sm break-all"
                >
                  {site.email}
                </a>
              </div>

              {/* Socials — only if this site has any configured */}
              {site.socials.length > 0 && (
                <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
                  <p className="type-label text-ink-3 mb-4">{t("socialLinks")}</p>
                  <div className="space-y-3">
                    {site.socials.map((social) => (
                      <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-on-dark/60 hover:text-ocean transition-colors text-sm"
                      >
                        {social.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/*
                Location, typographically.

                This card used to open with a hardcoded Unsplash URL alt-texted
                "Seoul skyline" — the photograph is Manhattan. Two problems in
                one element: a location card illustrating the wrong city, and an
                external image host baked into an engine component (a third-party
                request on every contact page view, plus a `next/image` remote
                allowlist entry to keep it working). A location doesn't need a
                stock photo to be stated, and stating it is the whole job.
              */}
              <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
                <p className="type-label text-ink-3 mb-4">{t("basedIn")}</p>
                <dl className="space-y-3">
                  <div>
                    <dt className="sr-only">{t("basedIn")}</dt>
                    <dd className="type-record text-ink text-[15px]">{t("seoulKorea")}</dd>
                  </div>
                  {site.location?.from && (
                    <div>
                      <dt className="type-label text-ink-3">{t("fromLabel")}</dt>
                      <dd className="type-record text-ink-2 mt-1">{site.location.from}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="type-label text-ink-3">{t("availabilityLabel")}</dt>
                    <dd className="type-record text-ink-2 mt-1">{tc("availableWorldwide")}</dd>
                  </div>
                </dl>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-bg border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="mb-8 flex items-center gap-3.5">
            <span className="accent-rule" aria-hidden />
            <span className="type-label text-ink-3">{t("faqsLabel")}</span>
            <span className="bg-line h-px flex-1" aria-hidden />
          </div>
          <h2 className="type-display text-ink mb-8 text-[calc(clamp(1.5rem,2.6vw,2.125rem)*var(--display-scale))] leading-tight">
            {t("faqsTitle")}
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-[var(--radius-card)] border border-line bg-surface p-5 md:p-6"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left font-semibold text-on-dark list-none">
                  <span>{faq.question}</span>
                  <svg
                    className="w-5 h-5 text-on-dark/50 transition-transform group-open:rotate-180 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm md:text-base text-on-dark/70 leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
