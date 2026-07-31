import { storeStatus } from "@/lib/crm/store";
import { ENGINE_VERSION, ENGINE_NAME } from "@/lib/engine-version";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

export default function AdminHelpPage() {
  const store = storeStatus();
  const supportEmail = site.crm?.supportEmail;
  return (
    <>
      <header className="crm-head">
        <div>
          <p className="crm-label">Site</p>
          <h1>How this works</h1>
        </div>
      </header>

      <div className="crm-grid crm-grid--2" style={{ alignItems: "start" }}>
        <section className="crm-card">
          <h2>Saving and publishing</h2>
          {store.problem && (
            <div className="crm-note crm-note--bad" style={{ marginTop: 10, marginBottom: 12 }}>
              <strong>Saving is not available on this deployment yet.</strong>
              <p style={{ marginTop: 6 }}>{store.problem}</p>
            </div>
          )}
          <p className="crm-hint" style={{ marginTop: 8 }}>
            {store.problem ? (
              <>
                Once publishing is configured, each save will commit to the site&apos;s repository and the live site
                will rebuild about a minute later.
              </>
            ) : store.driver === "github" ? (
              <>
                Each save commits to <span className="crm-mono">{store.target}</span>. The commit triggers a rebuild, so
                a change appears on the live site roughly a minute later — there is no separate &ldquo;publish&rdquo;
                button, and nothing sits in a queue.
              </>
            ) : (
              <>
                This CRM is running against the local working tree, so saves write to the files in this checkout and
                nothing is published. On the live deployment, saves commit to the repository instead.
              </>
            )}
          </p>
          <div className="crm-note" style={{ marginTop: 14 }}>
            Because every save is a git commit, anything can be reviewed or undone later with normal git tools. Nothing
            is overwritten silently.
          </div>
        </section>

        <section className="crm-card">
          <h2>What each section does</h2>
          <dl style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <div>
              <dt style={{ fontWeight: 550 }}>Posts</dt>
              <dd className="crm-hint" style={{ margin: "3px 0 0" }}>
                Articles, research commentary, policy briefs and blog entries. Save as a draft to keep something off the
                index while you work on it — the URL still opens, so it can be shared for review.
              </dd>
            </div>
            <div>
              <dt style={{ fontWeight: 550 }}>Pages</dt>
              <dd className="crm-hint" style={{ margin: "3px 0 0" }}>
                Every page is an ordered list of sections. You can reorder sections, change their wording, swap their
                images, and change the band each one sits on.
              </dd>
            </div>
            <div>
              <dt style={{ fontWeight: 550 }}>Media</dt>
              <dd className="crm-hint" style={{ margin: "3px 0 0" }}>
                Upload a photograph and copy its path. Uploads are rotated upright and resized automatically, so a photo
                straight off a phone is fine.
              </dd>
            </div>
            <div>
              <dt style={{ fontWeight: 550 }}>Settings</dt>
              <dd className="crm-hint" style={{ margin: "3px 0 0" }}>
                Site name, description, contact address and social links.
              </dd>
            </div>
          </dl>
        </section>

        <section className="crm-card">
          <h2>Writing a post body</h2>
          <pre
            className="crm-mono"
            style={{
              marginTop: 12,
              padding: 12,
              background: "var(--bg)",
              border: "1px solid var(--edge)",
              borderRadius: 7,
              fontSize: 12.5,
              whiteSpace: "pre-wrap",
              color: "var(--ink-2)",
            }}
          >{`A paragraph. Leave a blank line
between paragraphs.

## A subheading

> A pull quote, set large.

- A bulleted line
- Another one

1. A numbered line
2. Another one

**Bold** and *italic* work inline.`}</pre>
          <p className="crm-hint" style={{ marginTop: 10 }}>
            Anything else is shown as plain text. HTML is not accepted — that is deliberate, so a pasted snippet can
            never break the page or introduce a security problem.
          </p>
        </section>

        <section className="crm-card">
          <h2>What this can&apos;t do — and who does it</h2>
          <p className="crm-hint" style={{ marginTop: 8 }}>
            This CRM is the day-to-day half: words, photographs, new articles, no waiting on anybody. It deliberately
            cannot reach the other half, because the things below decide whether the site builds at all, and an
            accidental edit takes it down rather than making it say something different.
          </p>
          <ul className="crm-hint" style={{ marginTop: 10, paddingLeft: 18, display: "grid", gap: 6 }}>
            <li>Adding or removing whole pages, or changing a page&apos;s address.</li>
            <li>
              A new <em>kind</em> of section — a map, a gallery, a downloadable portfolio — rather than new content in an
              existing one.
            </li>
            <li>Colours, fonts, spacing, the navigation structure.</li>
            <li>Video, which is encoded as part of the build.</li>
            <li>
              <strong>Engine updates.</strong> This site runs Tzohar engine{" "}
              <span className="crm-mono">{ENGINE_VERSION}</span>
              {ENGINE_NAME ? ` (“${ENGINE_NAME}”)` : ""}. New section types, performance and accessibility fixes, and
              security patches arrive as an engine release — shipped into this repository for you, without touching a
              word of your content.
            </li>
          </ul>
          {supportEmail && (
            <div className="crm-note" style={{ marginTop: 14 }}>
              Any of those: <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
            </div>
          )}
          <div className="crm-note" style={{ marginTop: 10 }}>
            If a save is refused with an error, nothing was written. The message says what the site&apos;s content rules
            objected to.
          </div>
        </section>
      </div>
    </>
  );
}
