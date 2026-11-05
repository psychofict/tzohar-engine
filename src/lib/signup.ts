/**
 * Newsletter and Inner Circle sign-ups, in two steps (double opt-in, TZS-4, EBE-6326).
 *
 * The form's request sends one mail only: "confirm your address", to the typed address, within the
 * caller's, the recipient's and the site's limits (src/lib/mail-guard.ts). Nothing else happens
 * until the person presses the button the mail links to (src/app/api/newsletter/confirm): then
 * the owner gets the note, the person the welcome and, for the Inner Circle, the address goes to
 * the audience RESEND_AUDIENCE_ID names. A script that types strangers' addresses gets them one confirm mail a day
 * at most, and never a welcome or a list entry.
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/config/site";
import { innerCircleWelcome, newsletterWelcome, signupConfirmation } from "@/lib/email/siteMail";
import { allowCaller, allowRecipient, allowSiteSend, readJsonCapped, recipientHasRoom, typedEmail } from "@/lib/mail-guard";
import { confirmUrl, sealSignup, type Signup, type SignupKind } from "@/lib/mail-confirm";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const busy = () => NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
const unavailable = () => NextResponse.json({ error: "Please try again in a few minutes." }, { status: 503 });

/** Step one: the form's request. Answers 200 when the confirm mail went (or the address has had
 *  its share today, which the answer does not reveal). */
export async function startSignup(req: NextRequest, kind: SignupKind): Promise<NextResponse> {
  const caller = await allowCaller(req, kind);
  if (!caller.ok) return caller.status === 429 ? busy() : unavailable();

  const read = await readJsonCapped(req, 4 * 1024);
  if (!read.ok) return NextResponse.json({ error: "Invalid request" }, { status: read.status });
  if (!read.body.email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
  const email = typedEmail(read.body.email);
  if (!email) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });

  const signup: Signup = { kind, email };
  if (kind === "superfan") {
    const phone = typeof read.body.phone === "string" ? read.body.phone.trim().slice(0, 32) : "";
    const city = typeof read.body.city === "string" ? read.body.city.trim().slice(0, 80) : "";
    if (phone) signup.phone = phone;
    if (city) signup.city = city;
  }

  // The recipient first, so an address past its share costs the site's daily ceiling nothing.
  // Past that share the answer is the same as a sent mail, so the form does not tell a stranger
  // whether an address has been used.
  // Look first, count last: a try the site's ceiling refuses costs the address nothing.
  const room = await recipientHasRoom(email, "signup");
  if (!room.ok) return room.reason === "store" ? unavailable() : NextResponse.json({ success: true, confirm: true });
  const siteDay = await allowSiteSend("visitor");
  if (!siteDay.ok) return siteDay.status === 429 ? busy() : unavailable();
  const recipient = await allowRecipient(email, "signup");
  if (!recipient.ok) return recipient.reason === "store" ? unavailable() : NextResponse.json({ success: true, confirm: true });

  const token = sealSignup(signup);
  if (!token) {
    console.error("Sign-up: no key to seal the confirm link (RESEND_API_KEY or MAIL_CONFIRM_SECRET)");
    return unavailable();
  }
  const mail = signupConfirmation(site, kind, confirmUrl(token));
  const sent = await new Resend(process.env.RESEND_API_KEY, { baseUrl: process.env.RESEND_BASE_URL || "https://mail-api.ebenworks.co" }).emails.send({
    from: `${site.name} <${site.email}>`,
    to: email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
  if (sent.error) {
    console.error("Sign-up: confirm mail refused:", sent.error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 502 });
  }
  return NextResponse.json({ success: true, confirm: true });
}

/** Step two, after the button: the owner's note, then the welcome, then (Inner Circle) the list.
 *  Anything but "done" means the owner's note did not go, so the link may be pressed again. */
export async function completeSignup(s: Signup): Promise<"done" | "busy" | "failed" | "store"> {
  const resend = new Resend(process.env.RESEND_API_KEY, { baseUrl: process.env.RESEND_BASE_URL || "https://mail-api.ebenworks.co" });

  const owner = await allowSiteSend("owner");
  if (!owner.ok) return owner.reason === "store" ? "store" : "busy";
  const note =
    s.kind === "superfan"
      ? {
          subject: "New Inner Circle member",
          html: `
        <p>New Vault / Inner Circle signup (address confirmed):</p>
        <ul>
          <li><strong>Email:</strong> ${escapeHtml(s.email)}</li>
          <li><strong>Phone:</strong> ${s.phone ? escapeHtml(s.phone) : "&mdash;"}</li>
          <li><strong>City:</strong> ${s.city ? escapeHtml(s.city) : "&mdash;"}</li>
        </ul>
      `,
        }
      : {
          subject: "New newsletter subscriber!",
          html: `<p>New subscriber (address confirmed): <strong>${escapeHtml(s.email)}</strong></p>`,
        };
  const noted = await resend.emails.send({ from: `${site.name} Website <${site.email}>`, to: site.email, ...note });
  if (noted.error) {
    console.error("Sign-up: owner's note refused:", noted.error);
    return "failed";
  }

  {
    const welcome = s.kind === "superfan" ? innerCircleWelcome(site) : newsletterWelcome(site);
    const welcomed = await resend.emails.send({
      from: `${site.name} <${site.email}>`,
      to: s.email,
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text,
      headers: welcome.headers,
    });
    if (welcomed.error) console.error("Sign-up: welcome refused:", welcomed.error);
  }

  // Inner Circle: the confirmed address joins the audience RESEND_AUDIENCE_ID names, when one is set
  // (Resend's contacts call; the company's useSend front answers send, batch and read only, so there
  // the call fails and is logged below).
  if (s.kind === "superfan" && process.env.RESEND_AUDIENCE_ID) {
    try {
      const added = await resend.contacts.create({
        audienceId: process.env.RESEND_AUDIENCE_ID,
        email: s.email,
        unsubscribed: false,
      });
      if (added.error) console.error("Sign-up: audience add refused:", added.error);
    } catch (e) {
      console.error("Sign-up: audience add failed:", e);
    }
  }
  return "done";
}
