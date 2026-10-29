import { NextRequest, NextResponse } from "next/server";
import { startSignup } from "@/lib/signup";
import { isPreviewBuild } from "@/lib/preview-build";

// An Inner Circle sign-up sends only a confirm-your-address mail; the welcome, the owner's note
// and the audience add wait for the button in it (src/lib/signup.ts, TZS-4).
export async function POST(req: NextRequest) {
  // A preview build takes no sign-ups (src/lib/preview-build.ts): nothing is read, counted or
  // mailed, so a visitor to a preview cannot have a confirm mail sent to any address.
  if (isPreviewBuild) {
    return NextResponse.json({ error: "Sign-ups open when this site launches." }, { status: 404 });
  }
  try {
    return await startSignup(req, "superfan");
  } catch (error) {
    console.error("Superfan signup error:", error);
    return NextResponse.json({ error: "Failed to join. Please try again." }, { status: 500 });
  }
}
