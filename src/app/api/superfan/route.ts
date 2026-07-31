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

// Simple in-memory rate limiter (mirrors the newsletter route).
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
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
        { status: 429 },
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 32) : "";
    const city = typeof body.city === "string" ? body.city.trim().slice(0, 80) : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Best-effort: add to a Resend audience if one is configured. Never blocks
    // the signup if it's unset or fails.
    if (process.env.RESEND_AUDIENCE_ID) {
      try {
        await resend.contacts.create({
          audienceId: process.env.RESEND_AUDIENCE_ID,
          email,
          unsubscribed: false,
        });
      } catch (e) {
        console.error("Superfan audience add failed:", e);
      }
    }

    // Welcome email to the new member.
    await resend.emails.send({
      from: `${site.name} <${site.email}>`,
      to: email,
      subject: "You're in the Inner Circle",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0E0E10; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">The Vault</h1>
            <p style="color: rgba(255,255,255,0.7); margin-top: 8px; letter-spacing: 2px; text-transform: uppercase; font-size: 12px;">${escapeHtml(site.name)} · Inner Circle</p>
          </div>
          <div style="padding: 30px 20px; background: #FFFFFF;">
            <h2 style="color: #15121C;">Welcome in.</h2>
            <p style="color: #555; line-height: 1.6;">
              You'll get first listens, presale codes, behind-the-scenes drops and invite-only moments &mdash; before they go public. We'll only reach out when there's something worth it.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${site.url}/vault"
                 style="background: #1F5FE0; color: white; padding: 12px 30px; border-radius: 30px; text-decoration: none; display: inline-block;">
                Open the Vault
              </a>
            </div>
          </div>
          <div style="background: #F2EEE7; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              &copy; ${new Date().getFullYear()} ${escapeHtml(site.name)}.
            </p>
          </div>
        </div>
      `,
    });

    // Notify the artist with everything captured.
    await resend.emails.send({
      from: `${site.name} Website <${site.email}>`,
      to: site.email,
      subject: "New Inner Circle member",
      html: `
        <p>New Vault / Inner Circle signup:</p>
        <ul>
          <li><strong>Email:</strong> ${escapeHtml(email)}</li>
          <li><strong>Phone:</strong> ${phone ? escapeHtml(phone) : "&mdash;"}</li>
          <li><strong>City:</strong> ${city ? escapeHtml(city) : "&mdash;"}</li>
        </ul>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Superfan signup error:", error);
    return NextResponse.json({ error: "Failed to join. Please try again." }, { status: 500 });
  }
}
