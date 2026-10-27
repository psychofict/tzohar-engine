/**
 * The mail a site built on the engine sends to its visitors, in the site's own name.
 *
 * Eben approved the customer email design on 20 Oct 2026 (brand repository, customer-email/,
 * decision 14, and his yes for client sites the same day): mail a product sends in a customer's
 * name is the customer's paper. It is the tenant edition of the Record from the shared email kit
 * (blocks.generated.ts): the site's name heads it, the site's own accent colours it, and the one
 * mention of us is the small Tzohar Sites footer block under it. Every message has a text part.
 *
 * A site whose address is on ebenworks.co (the reference build, or a site with no mail domain of
 * its own yet) cannot send in its own name, so its contact acknowledgement is Tzohar Sites' own
 * mail instead: the proof edition from the support address (supportDesk.ts).
 *
 * These mails go to whatever address a public form names, so they carry nothing the visitor typed
 * except a first name that passes a letters-only check.
 */
import { resolveAccents } from "@tzohar/schema";
import type { ThemePreset } from "@tzohar/schema";
import { R, esc, renderRecord, type Block } from "./blocks.generated";

export const TZOHAR = {
  name: "Tzohar Sites",
  url: "https://tzohar-sites.ebenworks.co",
  logoUrl: "https://tzohar-sites.ebenworks.co/logo-light.png",
  logoWidth: 88,
  logoHeight: 48,
} as const;

export type SiteForMail = {
  name: string;
  email: string;
  url: string;
  theme?: ThemePreset | string;
  appearance?: { accent?: string; accentSecondary?: string } & Record<string, unknown>;
};

const INK = "#17140f";
/** A fill under this luminance is a deep step; light only (infra/docs/BRAND.md). */
const MIN_FILL_LUMINANCE = 0.16;

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The site's light-mode accent laid over the tenant edition, every pair at 4.5:1 or better. */
export function siteColours(site: SiteForMail): { accent: string; text: string; fill: string; fillType: string } {
  const { primary, primaryStrong } = resolveAccents(
    { theme: site.theme as ThemePreset, appearance: site.appearance } as Parameters<typeof resolveAccents>[0],
    "light",
  );
  const text = contrast(primaryStrong, "#ffffff") >= 4.5 ? primaryStrong : INK;
  // White type on the strong shade, unless that shade is deep: then the bright accent with ink type.
  if (luminance(text) >= MIN_FILL_LUMINANCE && contrast(text, "#ffffff") >= 4.5) {
    return { accent: primary, text, fill: text, fillType: "#ffffff" };
  }
  if (luminance(primary) >= MIN_FILL_LUMINANCE && contrast(primary, INK) >= 4.5) {
    return { accent: primary, text, fill: primary, fillType: INK };
  }
  return { accent: primary, text, fill: text, fillType: "#ffffff" };
}

/** The typed name's first word when it is a plain first name, else null: a link or an address
 *  typed into a name field never reaches the mail. */
export function firstName(typed: unknown): string | null {
  const first = String(typed ?? "").trim().split(/\s+/)[0] ?? "";
  return /^[\p{L}][\p{L}'’-]{0,29}$/u.test(first) ? first : null;
}

function host(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** One message in the site's own name: the tenant edition with the Tzohar Sites footer block. */
export function siteMail(
  site: SiteForMail,
  o: {
    title: string;
    preheader: string;
    strip: { top: string; bottom?: string };
    heading: string;
    blocks: Block[];
    why: string;
    unsubscribeUrl?: string;
  },
): { html: string; text: string } {
  return renderRecord({
    identity: { key: "tzohar", name: site.name },
    edition: "tenant",
    over: siteColours(site),
    title: o.title,
    preheader: o.preheader,
    strip: o.strip,
    heading: esc(o.heading),
    blocks: o.blocks,
    why: o.why,
    links: [{ label: host(site.url), href: site.url }],
    unsubscribeUrl: o.unsubscribeUrl,
    sentWith: {
      name: TZOHAR.name,
      // The block carries the joint stamp of Ebenworks and Statotech Systems (SO-39), which names the makers.
      line: `The ${site.name} website is built with Tzohar Sites.`,
      linkLabel: "Get a site like this",
      href: TZOHAR.url,
      logoUrl: TZOHAR.logoUrl,
      logoWidth: TZOHAR.logoWidth,
      logoHeight: TZOHAR.logoHeight,
    },
  });
}

/** Asking the site to take an address off its list: a mail to the site's own address. The list
 *  lives in the owner's inbox (the site keeps none), so the owner removes it by hand. */
export function unsubscribeMailto(site: SiteForMail): string {
  return `mailto:${site.email}?subject=${encodeURIComponent("Unsubscribe")}`;
}

/** The List-Unsubscribe header for the same address (RFC 2369). */
export function unsubscribeHeaders(site: SiteForMail): Record<string, string> {
  return { "List-Unsubscribe": `<${unsubscribeMailto(site)}>` };
}

export type SiteMessage = { subject: string; html: string; text: string; headers: Record<string, string> };

/** The welcome after a newsletter sign-up. */
export function newsletterWelcome(site: SiteForMail): SiteMessage {
  const subject = `You're on the ${site.name} mailing list`;
  const { html, text } = siteMail(site, {
    title: subject,
    preheader: `You'll be the first to hear the latest news from ${site.name}.`,
    strip: { top: "NEWSLETTER", bottom: "WELCOME" },
    heading: "You're on the list.",
    blocks: [
      R.lead(esc(`Thank you for subscribing. You'll be the first to hear what's new from ${site.name}.`)),
      R.button("tenant", `Visit ${site.name}`, site.url, { over: siteColours(site) }),
      R.spacer(16),
      R.small("If you didn't sign up, you can ignore this email. You won't hear from us again."),
    ],
    why: `You subscribed to updates through ${host(site.url)}.`,
    unsubscribeUrl: unsubscribeMailto(site),
  });
  return { subject, html, text, headers: unsubscribeHeaders(site) };
}

/** The welcome after joining a site's Inner Circle (the Vault). */
export function innerCircleWelcome(site: SiteForMail): SiteMessage {
  const subject = "Welcome to the Inner Circle";
  const vault = `${site.url.replace(/\/$/, "")}/vault`;
  const { html, text } = siteMail(site, {
    title: subject,
    preheader: "First listens, presale codes and invite-only moments before they're shared publicly.",
    strip: { top: "THE VAULT", bottom: "INNER CIRCLE" },
    heading: "Welcome to the Inner Circle.",
    blocks: [
      R.lead(esc("You'll receive first listens, presale codes, behind-the-scenes updates and invite-only moments before they're shared publicly. We'll only get in touch when there's something worth sharing.")),
      R.button("tenant", "Open the Vault", vault, { over: siteColours(site) }),
    ],
    why: `You joined the ${site.name} Inner Circle through ${host(site.url)}.`,
    unsubscribeUrl: unsubscribeMailto(site),
  });
  return { subject, html, text, headers: unsubscribeHeaders(site) };
}
