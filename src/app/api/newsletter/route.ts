import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/config/site";

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

    // Send welcome email
    await resend.emails.send({
      from: `${site.name} <${site.email}>`,
      to: email,
      subject: `Welcome — updates from ${site.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1B3A5C; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${escapeHtml(site.name)}</h1>
          </div>
          <div style="padding: 30px 20px; background: #FFFFFF;">
            <h2 style="color: #1A1A2E;">Thanks for subscribing!</h2>
            <p style="color: #555; line-height: 1.6;">
              You'll be the first to know about new research, public diplomacy engagements, and updates from ${escapeHtml(site.name)}.
            </p>
          </div>
          <div style="background: #F0F0EC; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              &copy; ${new Date().getFullYear()} ${escapeHtml(site.legalName ?? site.name)}. All rights reserved.
            </p>
          </div>
        </div>
      `,
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
