import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/config/site";
import { contactAcknowledgement } from "@/lib/email/supportDesk";
import { carryInline } from "@/lib/email/inline";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  // Purge expired entries to prevent unbounded memory growth
  if (rateLimit.size > 500) {
    for (const [key, val] of rateLimit) {
      if (now > val.resetAt) rateLimit.delete(key);
    }
  }
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = await req.json();
    const { type, name, email, message, ...rest } = body;

    // Validate required fields
    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Build subject based on inquiry type
    const subjectMap: Record<string, string> = {
      speaking: `Speaking Invitation from ${escapeHtml(name || email)}`,
      press: `Press Inquiry from ${escapeHtml(rest.outlet || email)}`,
      research: `Research Collaboration Inquiry from ${escapeHtml(name || email)}`,
      general: `General Inquiry from ${escapeHtml(name || email)}`,
    };

    const subject = subjectMap[type] || `New Inquiry from ${escapeHtml(email)}`;

    // Format the email body with all fields — sanitized
    const emailBody = Object.entries({ type, name, email, message, ...rest })
      .filter(([, v]) => v)
      .map(([k, v]) => `<strong>${escapeHtml(k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1'))}:</strong> ${escapeHtml(String(v))}`)
      .join("<br><br>");

    // Send notification. The SDK reports a refused send in `error` rather than throwing, so it is
    // read: the acknowledgement below tells the visitor their message was passed on.
    const notified = await resend.emails.send({
      from: `${site.name} Website <${site.email}>`,
      to: site.email,
      subject,
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

    // Auto-reply to the sender, on the support desk format and signature (SO-11, EBE-2278). From an
    // ebenworks.co site address it goes out as Tzohar Sites Support; a site with its own mail domain
    // keeps its own name (src/lib/email/supportDesk.ts).
    const ack = contactAcknowledgement(site, { type, name, artistName: rest.artistName });
    const inline = carryInline(ack.html); // the joint stamp and our logo inside the message (EBE-4891)
    const acked = await resend.emails.send({
      from: ack.from,
      to: email,
      replyTo: ack.replyTo,
      subject: ack.subject,
      html: inline.html,
      text: ack.text,
      attachments: inline.attachments,
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
