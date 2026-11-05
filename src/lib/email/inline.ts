/**
 * Kept for one engine release so a client site builds whose own edited contact route or sign-up
 * still calls carryInline (engine 2.8.29, EBE-9568). An edited engine file stays a conflict at sync
 * time and keeps its import of this module.
 *
 * Since 2.8.29 no picture travels inside visitor mail: every picture is linked from the mail
 * picture host. carryInline now points the Tzohar Sites logo's old address at its file on that host
 * and attaches nothing; the joint stamp already links the host through the email kit. Any other
 * picture, such as a site's own logo on its own domain, stays linked from its own address.
 * Remove this file in the release after next, once no client calls it.
 */
import { inlineImages, type InlineAttachment, type InlineImage } from "./blocks.generated";

const OLD_ADDRESSES: InlineImage[] = [
  { url: "https://tzohar-sites.ebenworks.co/logo-light.png", contentId: "tzohar-logo", filename: "", contentType: "image/png", content: "" },
];

export function carryInline(html: string): { html: string; attachments: InlineAttachment[] } {
  return inlineImages(html, OLD_ADDRESSES);
}
