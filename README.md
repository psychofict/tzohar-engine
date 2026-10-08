# Tzohar Sites

A framework for personal and academic websites — for researchers, public figures,
and independent professionals who need to be findable and credible on the open web.

Pages are composed from **typed section blocks** rather than filled into templates,
so a site is data you own rather than a layout you rent. Built with Next.js 16,
React 19, TypeScript and Tailwind v4.

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # type-checks, lints and builds
```

This repository is a working starter: it builds as-is, with no content. Put your
identity in `src/config/site.values.json`, your content in `src/data/*.json`, and
your copy in `messages/en.json`.

## What it does

**Composed pages.** Twenty section types — hero, statement, pillars, stats, card
grid, gallery, video, timeline, master–detail, journey map, portfolio builder, post
list, people, table, tabs, quote, CTA and more — declared as an ordered list in
`src/data/pages.json`. Every block carries a **tone** (`base · muted · deep ·
invert`), so a light site can still cut to a dark editorial band without a second
design.

**For researchers, specifically.** Publication lists with **ORCID import** and
**BibTeX import and export**, DOI links, a citation button, CV download, a
printable portfolio, and a **people block** for labs and research groups. Inline
maths in titles (`Fe$_3$O$_4$`, `$10^{-9}$ M`) renders without shipping a maths
library.

**The rest of the plumbing.** Locale routing with per-language message catalogues
and correct `hreflang`; schema.org structured data; Open Graph and Twitter cards;
canonical URLs; image optimisation with blurred placeholders; light and dark
themes with configurable accent, paper, type scale, radius and motion; contact and
newsletter handling; an optional membership seam (your own Stripe, an SSO hub, or
none).

**Modules.** Capabilities switch on in `site.modules`, and what is off is not
merely hidden — the tooling can remove its files entirely, so an unused feature
does not slow a build or confuse a search engine.

## Layout

```
src/app/            routes, layouts, API handlers
src/components/     UI, including blocks/ — one renderer per section type
src/lib/            helpers: modules guard, structured data, TeX, membership seam
src/config/         site.values.json (yours) + the loaders that validate it
src/data/           your content, as JSON, behind validating loaders
messages/           your copy, per locale
packages/schema/    the contract: Zod schemas, types, BibTeX and TeX
```

`packages/schema` is the single definition of every config and content shape. The
engine validates against it at load, so a malformed content file fails at build
with a precise message rather than at render with a blank page.

## Licence

**Apache-2.0.** See [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE).

The name "Tzohar", "Tzohar Sites" and "Ebenworks", and the associated logos, are
trademarks and are **not** licensed by Apache-2.0 (section 6). Fork the code; use
your own name.

## Where this comes from

Tzohar Sites is built and maintained by
[Ebenworks Systems (Private) Limited](https://ebenworks.co), which also runs it as
[a service](https://tzohar-sites.ebenworks.co): we design, compose and operate sites on this engine for people who would
rather not. That service is a separate, commercial product — the control plane that
onboards clients and ships engine releases into their repositories is not part of
this repository and is not open source.

The engine is, and stays that way, because every site we build is delivered into a
repository the client owns. A licence they can read is the difference between owning
a site and being allowed to use one.

Sponsorship and funding: [`funding.json`](./funding.json).
