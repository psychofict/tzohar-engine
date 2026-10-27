import { NextRequest, NextResponse } from "next/server";
import { startSignup } from "@/lib/signup";

// A newsletter sign-up sends only a confirm-your-address mail; the welcome and the owner's note
// wait for the button in it (src/lib/signup.ts, TZS-4).
export async function POST(req: NextRequest) {
  try {
    return await startSignup(req, "newsletter");
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
