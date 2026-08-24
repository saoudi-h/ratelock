# Worklog — 2026-08-23 — Home page NestJS visibility + icon fixes

## What was done

Maintainer review follow-up on INT-07. PR #27 merged (docs-only).

1. NestJS was missing from the home Integrations section AND the footer package list — the docs page and nav existed but discoverability surfaces were never updated. Tile added (bxl:nest-js, middleware badge, links to /docs/integrations/nestjs); footer Middleware & Plugins group extended with @ratelock/nestjs. Middleware grid widened to lg:grid-cols-5.
2. Express icon contrast: devicon:express glyph is black by design and disappeared on dark theme. Switched to simple-icons:express (currentColor, theme-adaptive). Maintainer-specified; verified on Iconify API.
3. Process note: lint-staged tooling changed under us mid-session (prettier/eslint → oxfmt/oxlint, turbo 2.10.9 → 2.10.11) — maintainer-side update; hooks pass unchanged.

## Lesson for future integration work

When adding an integration package, update ALL discoverability surfaces in the same PR: docs page + integrations/meta.json + home section tile + footer group. A checklist item worth crystallizing if this recurs.

## Next steps

- Backlog: [CORE-01], [DOC-01], [DOC-02]; parked [INT-06], [BUN-03].
- Maintainer has separate UI improvement ideas for a dedicated session.
