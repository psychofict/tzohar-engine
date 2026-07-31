import Image from "next/image";
import clsx from "clsx";
import type { z } from "zod";
import type { peopleBlockSchema } from "@tzohar/schema";
import { Mail, Link2 } from "lucide-react";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { BlockHeaderRow } from "./LeafBlocks";

/**
 * A lab, research group or team.
 *
 * Grouped in **first-appearance order**, not alphabetically and not by any
 * ranking we invent: academic hierarchies differ by country and discipline, so
 * the author's ordering is the only one that is reliably right. Members with no
 * `group` render first, ungrouped — which is what a small team wants, and what
 * a principal investigator listed above their students wants too.
 *
 * A server component. There is no state here, and a directory of twenty people
 * with twenty portraits should not ship a kilobyte of JavaScript to render.
 */
export default function PeopleBlock({ block }: { block: z.infer<typeof peopleBlockSchema> }) {
  const round = (block.portrait ?? "round") === "round";
  const cols = block.columns ?? 3;

  // Preserve author order, both within a group and between groups.
  const groups: { name: string | undefined; members: typeof block.members }[] = [];
  for (const m of block.members) {
    const found = groups.find((g) => g.name === m.group);
    if (found) found.members.push(m);
    else groups.push({ name: m.group, members: [m] });
  }

  return (
    <Container size="xl">
      <BlockHeaderRow header={block.header} />
      <div className="space-y-12">
        {groups.map((group, gi) => (
          <section key={gi}>
            {group.name && (
              <h3 className="text-ink-3 border-line mb-7 border-b pb-2.5 font-mono text-[11px] font-semibold tracking-[0.12em] uppercase">
                {group.name}
              </h3>
            )}
            <ul
              className={clsx(
                "grid gap-x-8 gap-y-10",
                cols === 2 && "sm:grid-cols-2",
                cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
                cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
              )}
            >
              {group.members.map((m, i) => (
                <Reveal key={i} delay={i * 0.04}>
                  <li className="flex gap-4">
                    <Portrait member={m} round={round} />
                    <div className="min-w-0 pt-0.5">
                      <h4 className="text-ink text-[15px] leading-snug font-semibold">{m.name}</h4>
                      {m.role && <p className="text-ocean mt-0.5 text-[13px] leading-snug">{m.role}</p>}
                      {m.period && (
                        <p className="text-ink-3 mt-1 font-mono text-[11px] tracking-wide">{m.period}</p>
                      )}
                      {m.note && <p className="text-ink-2 mt-2 text-[13px] leading-[1.55]">{m.note}</p>}
                      <Links member={m} />
                    </div>
                  </li>
                </Reveal>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Container>
  );
}

/** Portrait, or the initials that stand in for one. */
function Portrait({
  member,
  round,
}: {
  member: z.infer<typeof peopleBlockSchema>["members"][number];
  round: boolean;
}) {
  const shape = round ? "rounded-full" : "rounded-lg";
  if (!member.photo) {
    // Most group members will not have a portrait, and an empty grey square for
    // half a lab looks like a broken page. Initials read as deliberate.
    const initials = member.name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    return (
      <span
        aria-hidden="true"
        className={clsx(
          "bg-line-soft text-ink-3 grid size-14 flex-none place-items-center font-mono text-[13px] font-semibold",
          shape,
        )}
      >
        {initials}
      </span>
    );
  }
  return (
    <span className={clsx("relative size-14 flex-none overflow-hidden", shape)}>
      <Image
        src={member.photo}
        alt={member.photoAlt ?? member.name}
        fill
        sizes="56px"
        className="object-cover"
      />
    </span>
  );
}

/**
 * Contact and identity links.
 *
 * ORCID and Scholar accept either a bare identifier or a full URL, because
 * that is how people paste them — an ORCID iD is habitually written
 * `0000-0002-1825-0097`, and a Scholar profile is only ever seen as a URL.
 */
function Links({ member }: { member: z.infer<typeof peopleBlockSchema>["members"][number] }) {
  const orcid = member.orcid
    ? member.orcid.startsWith("http")
      ? member.orcid
      : `https://orcid.org/${member.orcid}`
    : undefined;
  const scholar = member.scholar
    ? member.scholar.startsWith("http")
      ? member.scholar
      : `https://scholar.google.com/citations?user=${member.scholar}`
    : undefined;
  const items: { href: string; label: string; node: React.ReactNode }[] = [];
  if (member.email) items.push({ href: `mailto:${member.email}`, label: "Email", node: <Mail className="size-3.5" /> });
  if (member.url) items.push({ href: member.url, label: "Website", node: <Link2 className="size-3.5" /> });
  if (orcid) items.push({ href: orcid, label: "ORCID", node: <span className="font-mono text-[10.5px]">iD</span> });
  if (scholar) items.push({ href: scholar, label: "Google Scholar", node: <span className="font-mono text-[10.5px]">GS</span> });
  if (items.length === 0) return null;

  return (
    <ul className="mt-2.5 flex flex-wrap items-center gap-2">
      {items.map((it) => (
        <li key={it.label}>
          <a
            href={it.href}
            target={it.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={it.href.startsWith("mailto:") ? undefined : "noreferrer"}
            aria-label={`${it.label} — ${member.name}`}
            title={it.label}
            className="border-line text-ink-3 hover:border-ocean hover:text-ocean grid size-7 place-items-center rounded-md border transition-colors"
          >
            {it.node}
          </a>
        </li>
      ))}
    </ul>
  );
}
