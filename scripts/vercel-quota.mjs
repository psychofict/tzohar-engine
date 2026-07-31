#!/usr/bin/env node
/**
 * How much of the Vercel deployment allowance is left, and when the next slot frees.
 *
 * The Hobby plan allows 100 deployments per ROLLING 24h, account-wide across every
 * project. When it is exhausted, both API and git-triggered deploys fail with
 * `402 payment_required` / `resource: "api-deployments-free-per-day"`, and the
 * response carries a `retry-after: 86400` that is simply wrong — the window rolls,
 * so capacity comes back as individual deployments age past 24h, often in minutes.
 * This script computes that instead of guessing.
 *
 *   npm run quota              summary + when slots free
 *   npm run quota -- --days 7  daily history as well
 *   npm run quota -- --json    machine-readable
 *
 * Auth: $VERCEL_TOKEN, else the local CLI token at
 * ~/.local/share/com.vercel.cli/auth.json. That token expires; if you get a 403
 * with `invalidToken`, run any `vercel` command (e.g. `vercel whoami`) to refresh
 * it in place, then re-run this.
 *
 * One caveat, and it only ever errs optimistically: this counts the deployments
 * Vercel still RETAINS in the window, but the cap counts deployments CREATED.
 * Deleting a deployment does not refund the allowance (tested: 59 deleted,
 * `remaining` stayed 0), so if you delete something recent, the figure below will
 * read as more headroom than you actually have. `--days` history is understated
 * the same way for any day you have since pruned.
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const LIMIT = Number(process.env.VERCEL_DEPLOY_LIMIT ?? 100);
const API = "https://api.vercel.com";

const argv = process.argv.slice(2);
const asJson = argv.includes("--json");
const days = Number(argv[argv.indexOf("--days") + 1]) || 0;

function token() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;
  try {
    const p = join(homedir(), ".local/share/com.vercel.cli/auth.json");
    const t = JSON.parse(readFileSync(p, "utf8")).token;
    if (t) return t;
  } catch {
    /* fall through */
  }
  console.error("No token. Set $VERCEL_TOKEN or sign in with `vercel login`.");
  process.exit(2);
}

const TOKEN = token();

async function api(path, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
  );
  const res = await fetch(`${API}${path}?${qs}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 403 && body.includes("invalidToken")) {
      console.error("Token expired. Run `vercel whoami` to refresh it, then retry.");
      process.exit(2);
    }
    throw new Error(`${res.status} ${path} — ${body.slice(0, 300)}`);
  }
  return res.json();
}

/** Vercel scopes everything by team; a "northstar" personal account is one too. */
async function scope() {
  if (process.env.VERCEL_TEAM_ID) return process.env.VERCEL_TEAM_ID;
  const { teams } = await api("/v2/teams", { limit: 20 });
  if (teams?.length) return teams[0].id;
  const { user } = await api("/v2/user");
  return user?.defaultTeamId;
}

const teamId = await scope();
const now = Date.now();
const since = now - Math.max(days, 1) * 864e5;

const projects = [];
for (let until; ; ) {
  const d = await api("/v9/projects", { teamId, limit: 100, until });
  projects.push(...d.projects);
  until = d.pagination?.next;
  if (!until) break;
}

const deployments = [];
await Promise.all(
  projects.map(async (p) => {
    for (let until; ; ) {
      const d = await api("/v6/deployments", {
        teamId,
        projectId: p.id,
        limit: 100,
        since,
        until,
      });
      const got = d.deployments ?? [];
      deployments.push(
        ...got.map((x) => ({
          project: p.name,
          created: x.created ?? x.createdAt,
          state: x.state ?? x.readyState,
          source: x.source,
        })),
      );
      until = d.pagination?.next;
      if (!until || !got.length) break;
    }
  }),
);

const window = deployments
  .filter((d) => d.created >= now - 864e5)
  .sort((a, b) => a.created - b.created);

const used = window.length;
const remaining = Math.max(0, LIMIT - used);

const byProject = {};
for (const d of window) byProject[d.project] = (byProject[d.project] ?? 0) + 1;

if (asJson) {
  console.log(
    JSON.stringify(
      {
        limit: LIMIT,
        used,
        remaining,
        byProject,
        freesAt: window.slice(0, 10).map((d) => new Date(d.created + 864e5).toISOString()),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const hhmm = (ms) =>
  new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const bar = (n, w = 40) =>
  "█".repeat(Math.round((Math.min(n, LIMIT) / LIMIT) * w)).padEnd(w, "·");

console.log(`\n  Vercel deployments — rolling 24h, account-wide\n`);
console.log(`  ${bar(used)}  ${used}/${LIMIT}`);
console.log(
  `  ${remaining} remaining${remaining === 0 ? "  — deploys are being rejected with 402" : ""}\n`,
);

if (used) {
  const w = Math.max(...Object.keys(byProject).map((k) => k.length));
  for (const [p, n] of Object.entries(byProject).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${p.padEnd(w)}  ${String(n).padStart(3)}`);
  }
  const next = window.slice(0, Math.min(5, used));
  console.log(`\n  Next slots free at: ${next.map((d) => hhmm(d.created + 864e5)).join(", ")}`);
  if (remaining === 0) {
    console.log(`  → retry at ${hhmm(window[0].created + 864e5)}, NOT in 24h.`);
  }
}

if (days > 1) {
  const byDay = {};
  for (const d of deployments) {
    const k = new Date(d.created).toISOString().slice(0, 10);
    byDay[k] = (byDay[k] ?? 0) + 1;
  }
  console.log(`\n  Last ${days} days\n`);
  for (const [k, n] of Object.entries(byDay).sort()) {
    console.log(`    ${k}  ${String(n).padStart(3)} ${bar(n, 30)}${n >= LIMIT ? "  CAP" : ""}`);
  }
}

const canceled = window.filter((d) => d.state === "CANCELED").length;
if (canceled) {
  console.log(
    `\n  ${canceled} of those ${used} were CANCELED — superseded builds still spend a slot.`,
  );
}
console.log();
