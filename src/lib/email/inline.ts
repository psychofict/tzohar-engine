/**
 * The pictures in our visitor mail travel inside the message, not as links (EBE-4891).
 *
 * On 22 Oct 2026 Gmail showed the Ebenworks stamp broken in a product's mail while ebenworks.co's
 * name servers answered SERVFAIL (EBE-4879), and tzohar-sites.ebenworks.co is in the same zone. Call
 * this at send, on the final HTML: the joint stamp (whose bytes are in the email kit) and the Tzohar
 * Sites logo (mail-images.generated.ts) become cid:<id> with an inline attachment each, in the Resend
 * SDK's shape. A picture it does not know, such as a site's own logo on its own domain, stays linked.
 */
import { inlineImages, type InlineAttachment } from "./blocks.generated";
import { MAIL_IMAGES } from "./mail-images.generated";

export function carryInline(html: string): { html: string; attachments: InlineAttachment[] } {
  return inlineImages(html, MAIL_IMAGES);
}
