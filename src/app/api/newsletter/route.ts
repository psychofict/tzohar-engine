import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/config/site";
import { newsletterWelcome } from "@/lib/email/siteMail";
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
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

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
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // The welcome, in the site's own name and colours with the Tzohar Sites footer block, a text part
    // and a way off the list (src/lib/email/siteMail.ts; customer email design, 20 Oct 2026).
    const welcome = newsletterWelcome(site);
    const inline = carryInline(welcome.html); // the joint stamp and our logo inside the message (EBE-4891)
    await resend.emails.send({
      from: `${site.name} <${site.email}>`,
      to: email,
      subject: welcome.subject,
      html: inline.html,
      text: welcome.text,
      headers: welcome.headers,
      attachments: inline.attachments,
    });

    // Notify site owner of new subscriber
    await resend.emails.send({
      from: `${site.name} Website <${site.email}>`,
      to: site.email,
      subject: "New newsletter subscriber!",
      html: `<p>New subscriber: <strong>${escapeHtml(email)}</strong></p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
