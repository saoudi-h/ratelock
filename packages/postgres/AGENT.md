# AGENT: packages/postgres

- Engine using SQL UPSERTs; multiple drivers under `src/drivers/` (pg, postgres.js); schema bootstrap in `src/migrations.ts`, maintenance in `src/cleanup.ts`.
- Integration tests (`*.integration.test.ts`) are excluded from the default vitest run; they need Docker Postgres on port 5434, Node-only.
- Parity contracts: `@ratelock/test-utils`: keep them green on any strategy change.
- Bun 1.4+: native `SQL` client is postgres.js-shaped; single queries are drop-in. CAUTION (maintainer stance): `Bun.SQL` is a unified multi-database API (PG/MySQL/SQLite), deliberately avoided for this project (perf focus, no dialect-specific features via generic surfaces); `@ratelock/postgres` must stay Postgres-only. Technically it speaks the native PG wire protocol (no ORM-style penalty), but adoption is PARKED pending benchmark evidence (BENCH-01) and explicit scope decision. If ever adopted: manual text[] serialization required (`sql.array()` quoting is broken in 1.4.0).
