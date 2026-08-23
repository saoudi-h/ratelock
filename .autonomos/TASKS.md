# PROJECT TASKS & ROADMAP

> **LEGEND**
> **Priority:** [🔴 Critical] [🟠 High] [🔵 Medium] [⚪ Low]
> **Complexity:** [S] Small (1h), [M] Medium (4h), [L] Large (1-2 days), [XL] Huge (Planning req.)
> **Status:** [ ] Todo, [/] In Progress, [x] Done, [!] Blocked

## 🚀 Active Sprint

- [x] **[TOOL-01]** Update dependencies; migrate lint/format from `@tala-tools/eslint`+`@tala-tools/prettier` to `@tala-tools/oxlint`+`@tala-tools/oxfmt`; evaluate TypeScript 7 adoption vs ecosystem tool compatibility (reference migration: solar-icons) `Priority: 🟠` `Complexity: L`

- [x] **[INIT-01]** Review project context and structure `Priority: 🔵` `Complexity: S`
- [x] **[INIT-02]** Triage legacy `BACKLOG.md` + `ANALYSIS_REPORT.md` into protocol issues/tasks `Priority: 🟠` `Complexity: M`
- [x] **[BUN-01]** Evaluate Bun 1.4 native Redis/Postgres clients as drivers. PoC against `@ratelock/redis` + `@ratelock/postgres`, decide internal drivers vs dedicated packages, document decision `Priority: 🟠` `Complexity: L`
- [x] **[BUN-02]** Implement `bun` driver in `@ratelock/redis` (Bun 1.4 RedisClient over existing `RedisClient` interface) `Priority: 🟠` `Complexity: M`
- [x] **[BENCH-01]** Benchmark Bun-native RedisClient vs node-redis/ioredis under Bun vs Node baseline, using `packages/bench` harness + docker compose `Priority: 🟠` `Complexity: M`
- [x] **[CORE-02]** Fix duplicate-id batch fallback: replace `Promise.all` with sequential loop (nondeterministic results on concurrent same-key upserts, exposed by Bun SQL) `Priority: 🔵` `Complexity: S`
- [x] **[ENV-01]** Align `engines.node` to `>=22` in all package.json (README + CONTRIBUTING already say 22+) `Priority: 🔵` `Complexity: S`
- [x] **[TST-01]** Run redis/postgres `__integration__` suites against Docker, assess coverage completeness `Priority: 🔵` `Complexity: M`
- [x] **[TST-02]** Strengthen contract suites: duplicate-id batch cases (would have caught CORE-02), per-key state assertions, deny propagation; add postgres `pg` pool driver leg to integration `Priority: 🟠` `Complexity: M`
- [x] **[REL-01]** Push `feat/bun-native-drivers`, open PR to main, let changesets + `release.yml` drive the versioning/publish flow `Priority: 🟠` `Complexity: S`

## 🔮 Backlog

- [x] **[INT-04]** Extract shared HTTP logic into private bundled `@ratelock/http-common` if duplication is confirmed when the third middleware lands (rule of three) `Priority: ⚪` `Complexity: S`
- [ ] **[BUN-03]** Postgres under Bun via `Bun.SQL`. PARKED: maintainer avoids unified multi-DB APIs (scope + perf stance); revisit only if BENCH-01-style evidence shows native client wins and scope decision is explicit `Priority: ⚪` `Complexity: M`
- [x] **[INT-01]** Hono middleware `@ratelock/hono`: engine-agnostic `rateLimit({ limiter })` accepting instance OR lazy factory (`() => Promise<Limiter>`, memoized singleton); headers `'both' | 'rfc' | 'legacy' | false` default `'both'` (+ Retry-After on 429); framework IP default + `keyGenerator` override; middleware contract tests in test-utils; README + docs page + changeset `Priority: 🟠` `Complexity: M`
- [x] **[INT-02]** Express middleware `@ratelock/express` — support Express 4 AND 5 (async error semantics differ); `req.ip` + `trust proxy`; tests via supertest; research exact APIs first `Priority: 🟠` `Complexity: M`
- [x] **[INT-03]** Fastify plugin `@ratelock/fastify` — fastify-plugin encapsulation pattern; `request.ip`; tests via built-in `inject()` `Priority: 🔵` `Complexity: M`
- [x] **[INT-05]** Elysia plugin `@ratelock/elysia` — Bun-native synergy with our native driver; pin supported Elysia version range (fast-moving ecosystem) `Priority: 🔵` `Complexity: M`
- [ ] **[INT-06]** Web-standard helper `@ratelock/web` — PARKED: competitor research shows market leader (Upstash) ships no framework packages for web-standard frameworks and manual 3-line pattern is the documented norm; Arcjet's counter-example is explained by IP-resolution machinery we deliberately don't own. Wake on user demand `Priority: ⚪` `Complexity: M`
- [x] **[INT-07]** NestJS integration `@ratelock/nestjs` — framework-agnostic (Express/Fastify multi-adapter); decorator + module/provider concepts justify a dedicated package with NestJS-idiomatic DX (Guard/Interceptor, DI-friendly limiter injection). Research official plugin patterns and supported majors first `Priority: 🔵` `Complexity: L`
- [ ] **[DOC-03]** Framework recipes documentation — manual pattern guides for Next.js route handlers / SvelteKit / Astro / Remix (+ SolidStart), including full headers snippet, Retry-After, lazy init, per-platform IP extraction recipes (CF-Connecting-IP, Vercel, self-hosted) `Priority: 🟠` `Complexity: M`
- [ ] **[ADP-01]** Upstash Redis adapter (serverless REST) `Priority: 🔵` `Complexity: M`
- [ ] **[ADP-02]** Cloudflare KV adapter (edge) `Priority: 🔵` `Complexity: M`
- [ ] **[ADP-03]** MongoDB adapter (TTL indexes) `Priority: ⚪` `Complexity: M`
- [ ] **[CORE-01]** Expose circuit breaker state getter for observability `Priority: ⚪` `Complexity: S`
- [ ] **[DOC-01]** Package health badges on README (coverage, bundle size) `Priority: ⚪` `Complexity: S`
- [ ] **[DOC-02]** JSDoc on exported engine factories (core is done, engines are not) `Priority: ⚪` `Complexity: S`
