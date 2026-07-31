import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import { site, hasModule } from "@/config/site";

// Single-language legal page (matches the hub's legal pages, which are English-only).
const HUB = (process.env.NEXT_PUBLIC_ACCOUNTS_URL || "https://accounts.ebenworks.co").replace(/\/+$/, "");
const SITE_HOST = new URL(site.url).host;

export default function PrivacyPage() {
  const membership = hasModule("membership");
  return (
    <main id="main-content" className="min-h-screen bg-bg text-ink">
      <Container size="sm" className="pt-28 sm:pt-32 pb-20">
        <h1 className="font-bold tracking-tight text-[clamp(1.9rem,4vw,2.75rem)]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-3">Last updated: 29 July 2026</p>

        <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-ink-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink [&_a]:text-ocean-strong [&_a:hover]:underline [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
          <p>
            This notice covers personal data that <strong>{SITE_HOST}</strong> — the official {site.name}{" "}
            website, operated by <strong>Ebenworks Systems (Pvt) Ltd</strong> (incorporated in Zimbabwe) —
            collects directly.
            {membership && (
              <>
                {" "}Your account, sign-in and billing data is handled by{" "}
                <strong>Ebenworks Accounts</strong> under its own{" "}
                <a href={`${HUB}/privacy`} target="_blank" rel="noopener noreferrer">Privacy Policy</a>; this
                notice covers what this site does on top of that.
              </>
            )}
          </p>

          <section>
            <h2>What this site collects</h2>
            <ul>
              <li>
                <strong>Newsletter sign-ups</strong> — your email address. Used to send updates on
                research, public diplomacy engagements, and site news via our email provider,{" "}
                <strong>Resend</strong>. You can unsubscribe from any email at any time.
              </li>
              <li>
                <strong>Contact form</strong> — your name, email and message, used only to respond to you
                (delivered via Resend).
              </li>
              {membership && (
                <>
                  <li>
                    <strong>Membership</strong> — when you subscribe, sign-in and payment run through
                    Ebenworks Accounts, with <strong>Stripe</strong> as the payment processor and Ebenworks
                    Systems (Pvt) Ltd as the merchant of record. This site only ever sees whether you are
                    signed in, your display name and your plan status.
                  </li>
                  <li>
                    <strong>Your profile</strong> — a display name and notification preferences you set on
                    your <Link href="/account">account</Link>, stored with your Ebenworks account.
                  </li>
                </>
              )}
              <li>
                <strong>Analytics &amp; cookies</strong> — we use Google Analytics, Plausible and Naver
                Analytics to understand traffic (pages viewed, device, approximate location). Your theme and
                language choices are stored in your browser. We do <strong>not</strong> sell your data or
                use it for third-party advertising.
              </li>
            </ul>
          </section>

          <section>
            <h2>Why we process it</h2>
            <ul>
              <li>To send the updates you asked for (consent — you can withdraw anytime).</li>
              <li>To respond to your enquiries (legitimate interest).</li>
              <li>To operate, secure and improve the site (legitimate interest).</li>
              {membership && (
                <li>To provide membership — handled via Ebenworks Accounts, with Stripe as payment processor.</li>
              )}
            </ul>
          </section>

          <section>
            <h2>Who we share it with</h2>
            <ul>
              <li><strong>Resend</strong> — email delivery (newsletter, contact).</li>
              {membership && <li><strong>Ebenworks Accounts</strong> &amp; <strong>Stripe</strong> — account and billing.</li>}
              <li><strong>Google, Plausible, Naver</strong> — analytics.</li>
            </ul>
            <p>We do not sell your personal information.</p>
          </section>

          <section>
            <h2>Your rights &amp; contact</h2>
            <p>
              You can access, correct, delete or export your data, or withdraw consent — email{" "}
              <a href="mailto:privacy@ebenworks.co">privacy@ebenworks.co</a>.
              {membership && " Requests about your account, identity or billing are handled through Ebenworks Accounts."}
            </p>
          </section>

          <section>
            <h2>Changes</h2>
            <p>We&apos;ll update this page and the date above when this notice changes.</p>
          </section>

          {membership && (
            <p className="text-sm text-ink-3">
              For account, identity and billing, see the{" "}
              <a href={`${HUB}/privacy`} target="_blank" rel="noopener noreferrer">Ebenworks Accounts Privacy Policy</a>,{" "}
              <a href={`${HUB}/terms`} target="_blank" rel="noopener noreferrer">Terms</a> and{" "}
              <a href={`${HUB}/refunds`} target="_blank" rel="noopener noreferrer">Refund Policy</a>.
            </p>
          )}
        </div>
      </Container>
    </main>
  );
}
