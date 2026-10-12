#!/usr/bin/env node
// Dependency audit gate: `npm audit`, minus a short, reviewed, EXPIRING allowlist.
//
// Why this exists. `npm audit --audit-level=high` fails on any high advisory, including
// one with no patched release anywhere. braces (GHSA-vfj7-8cjw-p6xm, 2026-10-03) is that
// case: 3.0.3 is the newest release and the last affected one, so no update can clear it
// and every repo that reaches it through micromatch turned red. Dismissing the GitHub
// alert does not change what npm reports.
//
// What it does. It runs `npm audit --json`, collects every advisory at or above --level
// (default high), and fails on any that is not in audit-allowlist.json next to this
// file. Each allowlist entry names the advisory id, the package, a reason and an `until`
// date. After that date the entry stops counting and the gate fails again, so an
// exception cannot be forgotten. A new advisory, or one that is not on the list, fails
// exactly as before. An entry that npm no longer reports is only noted, so it can be
// deleted.
//
// Usage: node scripts/audit-gate.mjs [--level=high|critical]
// Run it from the directory that holds the package-lock.json to check.
import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const rank = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 }
const level = (process.argv.find((a) => a.startsWith('--level=')) || '--level=high').split('=')[1]
if (!(level in rank)) {
  console.error(`audit-gate: unknown level "${level}"`)
  process.exit(2)
}

const listPath = join(dirname(fileURLToPath(import.meta.url)), 'audit-allowlist.json')
const allow = existsSync(listPath) ? JSON.parse(readFileSync(listPath, 'utf8')) : []
const today = process.env.AUDIT_GATE_TODAY || new Date().toISOString().slice(0, 10)

const run = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 })
let report
try {
  report = JSON.parse(run.stdout)
} catch {
  console.error('audit-gate: npm audit returned no JSON, so nothing was checked.')
  console.error((run.stdout + run.stderr).slice(0, 600))
  process.exit(2)
}
if (report.error) {
  console.error('audit-gate: npm audit failed, so nothing was checked:', JSON.stringify(report.error).slice(0, 600))
  process.exit(2)
}

// An advisory is an object inside some vulnerability's `via`; strings are just package names.
const found = new Map()
for (const [pkg, vuln] of Object.entries(report.vulnerabilities || {})) {
  for (const via of vuln.via || []) {
    if (typeof via !== 'object' || !via) continue
    const id = (via.url || '').split('/').pop() || String(via.source)
    if (!found.has(id)) found.set(id, { id, package: via.name || pkg, severity: via.severity, title: via.title })
  }
}

const failing = []
const allowed = []
for (const adv of found.values()) {
  if (rank[adv.severity] < rank[level]) continue
  const entry = allow.find((e) => e.id === adv.id)
  if (entry && entry.until >= today) allowed.push({ adv, entry })
  else if (entry) failing.push({ adv, why: `allowlist entry expired on ${entry.until}; review it again` })
  else failing.push({ adv, why: 'not on the allowlist' })
}

for (const { adv, entry } of allowed) {
  console.log(`allowed until ${entry.until}: ${adv.id} (${adv.package}, ${adv.severity}) ${adv.title}`)
}
for (const e of allow) {
  if (!found.has(e.id)) console.log(`note: ${e.id} is on the allowlist but npm no longer reports it; remove the entry.`)
}
if (failing.length) {
  for (const { adv, why } of failing) {
    console.error(`FAIL ${adv.id} (${adv.package}, ${adv.severity}): ${adv.title} [${why}]`)
  }
  console.error(`audit-gate: ${failing.length} advisory(ies) at or above "${level}" need fixing or a reviewed allowlist entry.`)
  process.exit(1)
}
console.log(`audit-gate: clean at "${level}" (${allowed.length} allowed by the reviewed list).`)
