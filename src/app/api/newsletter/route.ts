import { NextRequest, NextResponse } from "next/server";
import { startSignup } from "@/lib/signup";
import { isPreviewBuild } from "@/lib/preview-build";

// A newsletter sign-up sends only a confirm-your-address mail; the welcome and the owner's note
// wait for the button in it (src/lib/signup.ts, TZS-4).
export async function POST(req: NextRequest) {
  // A preview build takes no sign-ups (src/lib/preview-build.ts): nothing is read, counted or
  // mailed, so a visitor to a preview cannot have a confirm mail sent to any address.
  if (isPreviewBuild) {
    return NextResponse.json({ error: "Sign-ups open when this site launches." }, { status: 404 });
  }
  try {
    return await startSignup(req, "newsletter");
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
