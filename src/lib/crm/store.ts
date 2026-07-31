import { readFile, writeFile, readdir, stat, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * CRM storage seam — one interface, two drivers.
 *
 * `fs` writes straight to the working tree. Correct for local development and
 * useless in production: a Vercel deployment's filesystem is read-only and
 * ephemeral, so a "saved" edit would vanish on the next cold start.
 *
 * `github` commits to the repo through the Contents API, and the push triggers a
 * Vercel rebuild. That is why an edit takes ~a minute to appear: content is
 * versioned in git, every change is attributable and revertable with normal git
 * tools, and there is no database to run, back up or pay for. It is the same
 * model Tzohar Studio publishes with.
 *
 * The driver is chosen by what's available, not by NODE_ENV, so a developer can
 * exercise the real publish path locally by setting the token.
 */

export type Driver = "fs" | "github";

export function activeDriver(): Driver {
  if (process.env.CRM_DRIVER === "fs") return "fs";
  if (process.env.CRM_DRIVER === "github") return "github";
  return process.env.GITHUB_TOKEN && process.env.GITHUB_REPO ? "github" : "fs";
}

/**
 * True when the `fs` driver has been selected in a place it cannot possibly work.
 *
 * A serverless deployment's filesystem is read-only, so `fs` there is not a
 * fallback — it is a broken configuration. This was caught in production: with
 * `GITHUB_TOKEN` unset, `activeDriver()` returned `fs` and the CRM cheerfully
 * reported "saves write straight to the files in this checkout", which on Vercel
 * is the opposite of true. Detecting it lets the UI say "not configured" and lets
 * a save fail with a sentence an operator can act on instead of an EROFS stack.
 */
export function isMisconfigured(): boolean {
  return activeDriver() === "fs" && !!process.env.VERCEL;
}

/** Why publishing isn't wired up yet, or null when it is. */
export function misconfigurationReason(): string | null {
  if (!isMisconfigured()) return null;
  const missing = [
    !process.env.GITHUB_TOKEN && "GITHUB_TOKEN",
    !process.env.GITHUB_REPO && "GITHUB_REPO",
  ].filter(Boolean);
  return missing.length
    ? `Publishing is not configured: ${missing.join(" and ")} ${missing.length > 1 ? "are" : "is"} not set on this deployment.`
    : "Publishing is not configured: CRM_DRIVER is forced to “fs”, which cannot work on a read-only deployment.";
}

const REPO_ROOT = process.cwd();

/**
 * Paths the CRM is allowed to touch, as prefixes. Everything the CRM writes is
 * content or configuration; it must never be able to write a component, a route
 * or a workflow file. A CMS that can edit its own source is a remote-code-
 * execution hole wearing a nice form.
 */
const WRITABLE_PREFIXES = ["src/data/", "src/config/site.values.json", "public/images/uploads/"];

export function isWritable(repoPath: string): boolean {
  const clean = normalise(repoPath);
  return WRITABLE_PREFIXES.some((p) => (p.endsWith("/") ? clean.startsWith(p) : clean === p));
}

/** Reject traversal and absolute paths before they reach either driver. */
function normalise(repoPath: string): string {
  const clean = path.posix.normalize(repoPath.replace(/^\/+/, ""));
  if (clean.startsWith("..") || path.posix.isAbsolute(clean)) {
    throw new Error(`Refusing path outside the repo: ${repoPath}`);
  }
  return clean;
}

export type FileWrite = {
  /** Repo-relative path, e.g. `src/data/posts.json`. */
  path: string;
  /** UTF-8 text, or base64 for a binary upload. */
  content: string;
  encoding?: "utf8" | "base64";
};

// ── read ────────────────────────────────────────────────────────────────────

export async function readText(repoPath: string): Promise<string> {
  const clean = normalise(repoPath);
  if (activeDriver() === "fs") {
    return readFile(path.join(REPO_ROOT, clean), "utf8");
  }
  const { content, encoding } = await ghGetFile(clean);
  return encoding === "base64" ? Buffer.from(content, "base64").toString("utf8") : content;
}

export async function readJson<T>(repoPath: string): Promise<T> {
  return JSON.parse(await readText(repoPath)) as T;
}

/** List files under a public/ directory, for the media library. */
export async function listPublicDir(dir: string): Promise<{ path: string; size: number }[]> {
  const clean = normalise(dir);
  if (activeDriver() === "fs") {
    const abs = path.join(REPO_ROOT, clean);
    try {
      const names = await readdir(abs);
      const out: { path: string; size: number }[] = [];
      for (const name of names) {
        const s = await stat(path.join(abs, name));
        if (s.isFile()) out.push({ path: `${clean}/${name}`, size: s.size });
      }
      return out.sort((a, b) => a.path.localeCompare(b.path));
    } catch {
      return [];
    }
  }
  const items = await ghListDir(clean);
  return items.filter((i) => i.type === "file").map((i) => ({ path: i.path, size: i.size ?? 0 }));
}

// ── write ───────────────────────────────────────────────────────────────────

export type CommitResult = { driver: Driver; committed: string[]; sha?: string; url?: string };

export async function writeFiles(files: FileWrite[], message: string): Promise<CommitResult> {
  // Fail with the actual cause, before touching a filesystem that will only
  // return EROFS and send whoever reads the error hunting in the wrong place.
  const reason = misconfigurationReason();
  if (reason) throw new Error(`${reason} Nothing was saved. See docs/crm.md.`);

  for (const f of files) {
    if (!isWritable(f.path)) throw new Error(`Not a CRM-writable path: ${f.path}`);
  }
  if (activeDriver() === "fs") {
    for (const f of files) {
      const abs = path.join(REPO_ROOT, normalise(f.path));
      await mkdir(path.dirname(abs), { recursive: true });
      await writeFile(abs, Buffer.from(f.content, f.encoding === "base64" ? "base64" : "utf8"));
    }
    return { driver: "fs", committed: files.map((f) => f.path) };
  }
  return ghCommit(files, message);
}

// ── GitHub Contents API ─────────────────────────────────────────────────────

function ghConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // "owner/name"
  const branch = process.env.GITHUB_BRANCH ?? "main";
  if (!token || !repo) throw new Error("GITHUB_TOKEN and GITHUB_REPO are required for the github driver.");
  return { token, repo, branch };
}

async function gh(pathname: string, init?: RequestInit) {
  const { token } = ghConfig();
  const res = await fetch(`https://api.github.com${pathname}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${init?.method ?? "GET"} ${pathname} → ${res.status}: ${body.slice(0, 400)}`);
  }
  return res.json();
}

async function ghGetFile(repoPath: string): Promise<{ content: string; encoding: string; sha: string }> {
  const { repo, branch } = ghConfig();
  const data = await gh(`/repos/${repo}/contents/${encodeURI(repoPath)}?ref=${encodeURIComponent(branch)}`);
  return { content: data.content ?? "", encoding: data.encoding ?? "base64", sha: data.sha };
}

async function ghListDir(repoPath: string): Promise<{ path: string; type: string; size?: number }[]> {
  const { repo, branch } = ghConfig();
  try {
    const data = await gh(`/repos/${repo}/contents/${encodeURI(repoPath)}?ref=${encodeURIComponent(branch)}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Commit several files as ONE commit, via the git data API (blobs → tree →
 * commit → ref).
 *
 * The simpler `PUT /contents/{path}` endpoint writes one file per commit, which
 * for a publish touching pages.json plus an uploaded image would produce two
 * commits, two Vercel builds, and a window where the page references an image
 * that isn't deployed yet. One commit means one build and no such window.
 */
async function ghCommit(files: FileWrite[], message: string): Promise<CommitResult> {
  const { repo, branch } = ghConfig();

  const ref = await gh(`/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  const headSha: string = ref.object.sha;
  const headCommit = await gh(`/repos/${repo}/git/commits/${headSha}`);
  const baseTree: string = headCommit.tree.sha;

  const tree = await Promise.all(
    files.map(async (f) => {
      const blob = await gh(`/repos/${repo}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({
          content: f.content,
          encoding: f.encoding === "base64" ? "base64" : "utf-8",
        }),
      });
      return { path: normalise(f.path), mode: "100644", type: "blob", sha: blob.sha };
    }),
  );

  const newTree = await gh(`/repos/${repo}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTree, tree }),
  });

  const commit = await gh(`/repos/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: newTree.sha, parents: [headSha] }),
  });

  await gh(`/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });

  return {
    driver: "github",
    committed: files.map((f) => f.path),
    sha: commit.sha,
    url: `https://github.com/${repo}/commit/${commit.sha}`,
  };
}

export type StoreStatus = {
  driver: Driver;
  target: string;
  instant: boolean;
  /** Set when the configuration cannot work here — the UI should warn, not reassure. */
  problem: string | null;
};

/** Reported in the CRM header so an operator knows where a save actually goes. */
export function storeStatus(): StoreStatus {
  const driver = activeDriver();
  const problem = misconfigurationReason();
  if (problem) {
    return { driver, target: "not configured", instant: false, problem };
  }
  if (driver === "fs") {
    return { driver, target: "local working tree", instant: true, problem: null };
  }
  const repo = process.env.GITHUB_REPO ?? "(GITHUB_REPO unset)";
  const branch = process.env.GITHUB_BRANCH ?? "main";
  return { driver, target: `${repo}@${branch}`, instant: false, problem: null };
}
