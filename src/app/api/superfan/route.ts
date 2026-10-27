import { NextRequest, NextResponse } from "next/server";
import { startSignup } from "@/lib/signup";

// An Inner Circle sign-up sends only a confirm-your-address mail; the welcome, the owner's note
// and the audience add wait for the button in it (src/lib/signup.ts, TZS-4).
export async function POST(req: NextRequest) {
  try {
    return await startSignup(req, "superfan");
  } catch (error) {
    console.error("Superfan signup error:", error);
    return NextResponse.json({ error: "Failed to join. Please try again." }, { status: 500 });
  }
}
