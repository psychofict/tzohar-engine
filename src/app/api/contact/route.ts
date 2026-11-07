import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/config/site";
import { fromHeader, oneLine, subjectWith } from "@/lib/email/headers";
import { contactAcknowledgement } from "@/lib/email/supportDesk";
import { allowCaller, allowRecipient, allowSiteSend, readJsonCapped, recipientHasRoom, typedEmail } from "@/lib/mail-guard";
import { isPreviewBuild } from "@/lib/preview-build";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// The fields the engine's contact forms send (src/app/[locale]/contact/page.tsx), each with its
// longest accepted length; anything else is dropped before the owner's note is written (TZS-4).
const FIELDS: Record<string, number> = {
  type: 40, name: 120, message: 5000, outlet: 120, artistName: 120,
  eventType: 200, date: 40, location: 200, deadline: 40, topic: 2000,
  collabType: 200, links: 1000, genre: 120, musicLinks: 1000,
};
// The field caps add up to about 10,200 characters, about 31 KB of UTF-8 in Korean, Japanese or Chinese.
const MAX_BODY_BYTES = 32 * 1024;

const busy = () => NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
const unavailable = () => NextResponse.json({ error: "Please try again in a few minutes." }, { status: 503 });

export async function POST(req: NextRequest) {
  // A preview build's contact form is closed (src/lib/preview-build.ts): nothing is read,
  // counted or mailed.
  if (isPreviewBuild) {
    return NextResponse.json({ error: "The contact form opens when this site launches." }, { status: 404 });
  }
  try {
    // Every limit counts in the site's store (src/lib/mail-guard.ts): the caller first, then the
    // site's daily ceiling for the owner's note; the acknowledgement also needs its recipient's.
    const caller = await allowCaller(req, "contact");
    if (!caller.ok) return caller.status === 429 ? busy() : unavailable();

    const read = await readJsonCapped(req, MAX_BODY_BYTES);
    if (!read.ok) {
      return NextResponse.json(
        { error: read.status === 413 ? "Your message is too long" : "Invalid request" },
        { status: read.status },
      );
    }
    const fields: Record<string, string> = {};
    for (const [k, max] of Object.entries(FIELDS)) {
      const v = read.body[k];
      if (typeof v === "string" && v.trim()) fields[k] = v.trim().slice(0, max);
    }
    const { type, name, message, ...rest } = fields;
    const email = typedEmail(read.body.email);

    // Validate required fields
    if (!read.body.email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!email) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const siteDay = await allowSiteSend("owner");
    if (!siteDay.ok) return siteDay.status === 429 ? busy() : unavailable();

    const resend = new Resend(process.env.RESEND_API_KEY, { baseUrl: process.env.RESEND_BASE_URL || "https://mail-api.ebenworks.co" });

    // Build subject based on inquiry type. A header is plain text, so the typed name goes in as typed,
    // on one line, and cut to the subject limit (src/lib/email/headers.ts); only the HTML body escapes it.
    const subjectMap: Record<string, string> = {
      speaking: subjectWith("Speaking Invitation from ", name, email),
      press: subjectWith("Press Inquiry from ", rest.outlet, email),
      research: subjectWith("Research Collaboration Inquiry from ", name, email),
      general: subjectWith("General Inquiry from ", name, email),
    };

    // Only a listed type has its own subject: "constructor" or "__proto__" typed into the form would
    // otherwise find a property every object has.
    const subject = Object.hasOwn(subjectMap, type ?? "") ? subjectMap[type ?? ""] : subjectWith("New Inquiry from ", email);

    // Format the email body with all fields: HTML (sanitized) and the same facts as text
    const rows = Object.entries({ type, name, email, message, ...rest })
      .filter(([, v]) => v)
      .map(([k, v]) => [k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, " $1"), String(v)] as const);
    const emailBody = rows
      .map(([label, v]) => `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(v)}`)
      .join("<br><br>");
    const emailText = [
      `New ${oneLine(type ?? "") || "General"} Inquiry`,
      ...rows.map(([label, v]) => `${label}: ${v.replace(/\r\n?/g, "\n")}`),
      `Sent from the ${site.name} contact form`,
    ].join("\n\n");

    // Send notification. The SDK reports a refused send in `error` rather than throwing, so it is
    // read: the acknowledgement below tells the visitor their message was passed on.
    const notified = await resend.emails.send({
      from: fromHeader(`${site.name} Website`, site.email),
      to: site.email,
      subject,
      text: emailText,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1B3A5C;">New ${escapeHtml(type || "General")} Inquiry</h2>
          <div style="background: #F7F7F7; padding: 20px; border-radius: 8px; line-height: 1.8;">
            ${emailBody}
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Sent from the ${escapeHtml(site.name)} contact form
          </p>
        </div>
      `,
    });

    if (notified.error) {
      console.error("Email error (notification):", notified.error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
    }

    // The acknowledgement goes to the typed address only within that address's daily allowance and
    // the site's; past either, the owner still has the message and the visitor is told it arrived.
    // The recipient first: an address past its share costs the site's daily ceiling nothing.
    const ackAllowed =
      (await recipientHasRoom(email, "contact")).ok && (await allowSiteSend("visitor")).ok && (await allowRecipient(email, "contact")).ok;
    if (!ackAllowed) return NextResponse.json({ success: true });

    // Auto-reply to the sender, on the support desk format and signature (SO-11, EBE-2278). From an
    // ebenworks.co site address it goes out as Tzohar Sites Support; a site with its own mail domain
    // keeps its own name (src/lib/email/supportDesk.ts).
    const ack = contactAcknowledgement(site, { type, name, artistName: rest.artistName });
    const acked = await resend.emails.send({
      from: ack.from,
      to: email,
      replyTo: ack.replyTo,
      subject: ack.subject,
      html: ack.html,
      text: ack.text,
    });
    if (acked.error) console.error("Email error (acknowledgement):", acked.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
