import { NextResponse } from "next/server";
import { site } from "@/config/site";

/**
 * What a CRM route answers when a save fails (security review TZS-12).
 *
 * Two kinds of failure are the editor's to fix and are told plainly: their own edit
 * breaking the content rules (`CrmContentError`, from `checkEdit`), and the CRM being
 * set up wrong on this deployment (`CrmConfigError`, which names settings, never their
 * values). Anything else (a GitHub or Cloudinary answer, which can name the
 * repository, a stored file that no longer parses, a stack) goes to the server log only,
 * and the editor gets a fixed text.
 */
type Issue = { path?: PropertyKey[]; message?: string };

export class CrmContentError extends Error {
  constructor(readonly issues: Issue[]) {
    super("content rules");
    this.name = "CrmContentError";
  }
}

export class CrmConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrmConfigError";
  }
}

/** Parse the editor's edited document; a schema failure becomes a CrmContentError. */
export function checkEdit<T>(parse: () => T): T {
  try {
    return parse();
  } catch (err) {
    const e = err as { name?: unknown; issues?: unknown };
    if (e && e.name === "ZodError" && Array.isArray(e.issues)) throw new CrmContentError(e.issues as Issue[]);
    throw err;
  }
}

export function crmFailure(err: unknown, what: string): NextResponse {
  if (err instanceof CrmContentError) {
    const listed = err.issues
      .slice(0, 3)
      .map((i) => `${(i.path ?? []).map(String).join(" › ") || "document"}: ${String(i.message ?? "invalid")}`)
      .join("; ");
    return NextResponse.json(
      { success: false, error: `Not saved. Please fix: ${listed}${err.issues.length > 3 ? "; …" : ""}` },
      { status: 400 },
    );
  }
  if (err instanceof CrmConfigError) {
    return NextResponse.json({ success: false, error: err.message }, { status: 503 });
  }
  console.error(`[crm] ${what} failed:`, err);
  const help = site.crm?.supportEmail ? ` If it keeps failing, write to ${site.crm.supportEmail}.` : "";
  return NextResponse.json(
    { success: false, error: `Saving the ${what} failed. Try again in a minute.${help}` },
    { status: 502 },
  );
}
