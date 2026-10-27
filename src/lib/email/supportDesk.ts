/**
 * The acknowledgement a visitor gets after using a site's contact form.
 *
 * Eben approved the customer email design on 20 Oct 2026 (brand repository, customer-email/). Who
 * the mail is from decides whose paper it is:
 *
 * - The site's address is on ebenworks.co (the reference build, or a site that has no mail domain
 *   of its own yet). Ebenworks is the sender, so it is Tzohar Sites' own support mail in the proof
 *   edition of the Record: From "Tzohar Sites Support <tzohar-sites@ebenworks.co>", replies to the
 *   site's address.
 * - The site sends from its own domain. The mail is the site's: the tenant edition in its own name
 *   and colours, with the Tzohar Sites footer block (siteMail.ts).
 *
 * Both come from the shared email kit with a text part. The form names the address the mail goes
 * to, so it carries nothing the visitor typed except a first name that passes a letters-only check.
 */
import { R, esc, renderRecord } from "./blocks.generated";
import { TZOHAR, firstName, siteMail, type SiteForMail } from "./siteMail";

export const TZOHAR_SUPPORT = {
  product: "Tzohar Sites",
  name: "Tzohar Sites Support",
  address: "tzohar-sites@ebenworks.co",
} as const;

/** Mail from an ebenworks.co address is Ebenworks mail, so it goes as Tzohar Sites' own. */
export function sendsAsEbenworks(siteEmail: string): boolean {
  return /@ebenworks\.co$/i.test(siteEmail.trim());
}

const KIND: Record<string, string> = {
  booking: "booking enquiry",
  speaking: "speaking invitation",
  press: "press enquiry",
  collaborations: "collaboration proposal",
  research: "research enquiry",
  labelSubmissions: "demo submission",
  general: "message",
};

export type ContactAck = { from: string; replyTo: string; subject: string; html: string; text: string };

function host(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/**
 * A service reply to someone who wrote in, so Eben's 12 Oct order on customer messages does not hold
 * it back; it is the same one mail the form always sent.
 */
export function contactAcknowledgement(site: SiteForMail, input: { type?: unknown; name?: unknown; artistName?: unknown }): ContactAck {
  const first = firstName(input.name || input.artistName);
  const greeting = first ? `Hello ${first},` : "Hello,";
  const kind = KIND[String(input.type ?? "")] ?? "message";
  const subject = `Your message to ${site.name}`;

  if (sendsAsEbenworks(site.email)) {
    const { html, text } = renderRecord({
      identity: { key: "tzohar", name: TZOHAR.name, logoUrl: TZOHAR.logoUrl, logoWidth: 150, logoHeight: 81 },
      edition: "proof",
      title: subject,
      preheader: `We've received your ${kind} for ${site.name}. You'll receive a reply at this email address.`,
      eyebrow: "Message received",
      heading: "We've received your message.",
      blocks: [
        R.p(esc(greeting), greeting),
        R.p(esc(`Thank you for contacting ${site.name}. Your ${kind} came through the ${site.name} website, which runs on Tzohar Sites. We've passed it on, and you'll receive a reply at this email address.`)),
        R.p(esc(`There's no need to send your message again. If you'd like to add anything, simply reply to this email and it will reach ${site.name}.`)),
      ],
      why: `You contacted ${site.name} through ${host(site.url)}.`,
      links: [{ label: host(site.url), href: site.url }, { label: "Tzohar Sites", href: TZOHAR.url }],
    });
    return { from: `${TZOHAR_SUPPORT.name} <${TZOHAR_SUPPORT.address}>`, replyTo: site.email, subject, html, text };
  }

  const { html, text } = siteMail(site, {
    title: subject,
    preheader: `We've received your ${kind}. You'll receive a reply at this email address.`,
    strip: { top: "MESSAGE RECEIVED" },
    heading: "We've received your message.",
    blocks: [
      R.p(esc(greeting), greeting),
      R.p(esc(`Thank you for contacting ${site.name}. We've received your ${kind}, and you'll receive a reply at this email address.`)),
      R.p("There's no need to send your message again. If you'd like to add anything, simply reply to this email."),
    ],
    why: `You contacted ${site.name} through ${host(site.url)}.`,
  });
  return { from: `${site.name} <${site.email}>`, replyTo: site.email, subject, html, text };
}
