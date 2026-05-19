# RateLock Backlog

> Last updated: 2026-05-19
> Status: Active development — v0.2 (unreleased)

---

## Completed

- [x] Fix ESLint errors in `@ratelock/core` (cache.ts conditionals, .eslintignore removal)
- [x] Fix typecheck errors in `@ratelock/docs` (mdx/types, implicit any)
- [x] Re-enable tests in CI/CD workflow
- [x] Remove duplicate `@ratelock/core` dependency in `@ratelock/redis`
- [x] Clean `@ratelock/test-utils` (remove publishConfig, set version to 0.0.0)
- [x] Set `@ratelock/vitest` version to 0.0.0
- [x] Align `engines.node` to `>=22` across all packages
- [x] Align package.json metadata (repository, bugs, homepage) on all packages
- [x] Add missing files to `@ratelock/postgres` (LICENSE, README, .gitignore, configs)
- [x] Add docker-compose and .env.test to `@ratelock/postgres` (port 5434)
- [x] Add integration test scaffold for `@ratelock/postgres`
- [x] Align package scripts (dev, prepack, test:coverage, docker:up/down)
- [x] Rewrite all READMEs with concise, developer-friendly documentation style
- [x] Create CODE_OF_CONDUCT.md
- [x] Create CONTRIBUTING.md
- [x] Create technical analysis report (ANALYSIS_REPORT.md)
- [x] Create runtime compatibility document (RUNTIME_COMPATIBILITY.md)
- [x] Create PR workflow CI (`.github/workflows/ci.yml`)

---

## High Priority

### Core Bugs & Correctness

- [ ] **Circuit breaker: preserve original error context** — Wrap "circuit open" errors with `{ cause: err }` so consumers can inspect the root cause. See `ANALYSIS_REPORT.md` section 1.
- [ ] **Circuit breaker: concurrent half-open probe guard** — Add a boolean flag to ensure only one request acts as the half-open probe under concurrent load. See `ANALYSIS_REPORT.md` section 1.
- [ ] **Redis sliding window: incorrect windowStart** — Return the actual oldest timestamp from the sorted set instead of `now - windowMs`. See `ANALYSIS_REPORT.md` section 4.
- [ ] **Local checkBatch: same-ID race condition** — Deduplicate IDs or process sequentially per-key to avoid concurrent reads of stale state. See `ANALYSIS_REPORT.md` section 3.

### Testing

- [ ] **Fix `@tala-tools/eslint` ESM import bug** — The package uses `import * as js from "@eslint/js"` which fails with ESLint 10 because CJS modules expose their exports under `.default` in ESM namespace imports. Upstream fix needed: change to `import js from "@eslint/js"`. Affects `@ratelock/redis`, `@ratelock/local`, `@ratelock/postgres`. `@ratelock/core` works due to different pnpm resolution. Workaround: fork/patch `@tala-tools/eslint` or migrate to a self-owned ESLint config.
- [ ] **Add Redis integration tests** — Redis currently has no tests. Add contract-based integration tests using docker-compose.
- [ ] **Verify postgres integration tests run** — The integration test file was created but needs to be verified against a real PostgreSQL instance.
- [ ] **Add PR workflow CI** — Create a `.github/workflows/ci.yml` that runs lint, typecheck, and tests on pull requests.

### Documentation Site

- [ ] **Initialize docs content** — The docs app (`apps/docs`) is empty. Add landing page, getting started guide, and API reference.
- [ ] **Configure Fumadocs source** — Set up content collections and navigation structure.

---

## Medium Priority

### Performance

- [ ] **Redis checkBatch: use pipelining** — Replace `Promise.all` with Redis MULTI/EXEC or pipelined EVALSHA for true batch operations.
- [ ] **PostgreSQL checkBatch: single query** — Use `WHERE key = ANY($1)` for batch checks instead of N individual queries.

### Developer Experience

- [ ] **Add `invalidate(id)` to withCache** — Allow manual cache busting for specific identifiers.
- [ ] **Document cache TTL guidance** — Add JSDoc warning that `ttlMs` should be <= smallest window duration.
- [ ] **Add publint to CI** — Run `publint` on all publishable packages before release.

### Runtime Compatibility

- [ ] **Evaluate Bun.js compatibility** — Test all packages under Bun. Document any known issues.
- [ ] **Evaluate Deno compatibility** — Assess effort required for Deno support. Track in runtime-compatibility.md.

---

## Low Priority

### Code Quality

- [ ] **PostgreSQL sliding window: asymmetric remaining** — Fix the edge case where `allowed === true` but `remaining === 0`. See `ANALYSIS_REPORT.md` section 5.
- [ ] **Add JSDoc to all exported functions** — Improve IDE autocomplete and generated documentation.
- [ ] **Consider exposing circuit state** — Add a getter for circuit breaker state for monitoring/observability.

### Infrastructure

- [ ] **Add Renovate config** — Automate dependency updates with sensible grouping rules.
- [ ] **Add package health badges to README** — Coverage, bundle size, etc.

---

## Future / Ideas

- [ ] **MongoDB adapter** — `@ratelock/mongo` using TTL indexes and findOneAndUpdate.
- [ ] **Upstash Redis adapter** — `@ratelock/upstash` for serverless/edge deployments.
- [ ] **Edge runtime adapter** — `@ratelock/edge` using Cloudflare KV or Durable Objects.
- [ ] **Framework integrations** — First-party middleware for Express, Fastify, Hono, NestJS.
- [ ] **Rate limit headers middleware** — Automatic `X-RateLimit-*` header injection.
- [ ] **Dashboard / admin UI** — Visual monitoring of rate limit state across adapters.

---

## Notes

### Versioning

- Packages are currently at v0.2.0 but **nothing has been published yet**.
- Versions will be managed by Changesets on first publish.
- Internal packages (`test-utils`, `vitest`) use version `0.0.0` and are marked `private: true`.

### Node.js Version

- Minimum supported: **Node.js 22**
- Bun.js: Planned (compatible via Node.js API)
- Deno: Planned (lower priority)

### Port Conventions

- Redis test instance: **6380** (not default 6379)
- PostgreSQL test instance: **5434** (not default 5432)
