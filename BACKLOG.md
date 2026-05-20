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
- [x] Populate docs site with full content (strategies, adapters, decorators)
- [x] Fix Fumadocs content directory path (`src/content/docs`)
- [x] Re-export decorators from all adapter packages
- [x] Rewrite docs: decorators as "Advanced: Standalone Decorators"

---

## High Priority

### Core Bugs & Correctness

- [x] **Circuit breaker: preserve original error context** — Wrap "circuit open" errors with `{ cause: err }`.
- [x] **Circuit breaker: concurrent half-open probe guard** — Boolean flag for single probe.
- [x] **Redis sliding window: incorrect windowStart** — Return actual oldest timestamp.
- [~] **Local checkBatch: same-ID race condition** — *(Invalid: JS execution is synchronous, no interleaving).*

### Testing

- [ ] **Fix `@tala-tools/eslint` ESM import bug** — CJS modules expose `.default` in ESM namespace imports. Upstream fix needed.
- [ ] **Add Redis integration tests** — Contract-based tests using docker-compose.
- [ ] **Verify postgres integration tests** — Run against real PostgreSQL instance.

### Docs UX Improvements (from solar-icons patterns)

- [ ] **Package manager tabs** — `<CodeBlockTabs>` for npm/pnpm/yarn/bun snippets
- [ ] **LLMs routes** — `/llms.txt`, `/llms.mdx/[[...slug]]`, `/llms-full.txt`
- [ ] **Copy page as text** — `MarkdownCopyButton` + `ViewOptionsPopover` on each docs page
- [ ] **Last modified date** — `PageLastUpdate` component on docs pages
- [ ] **GitHub feedback widget** — Like/Dislike with GitHub Discussions integration
- [ ] **Custom 404 page** — Branded not-found with go-home and go-back actions

---

## Medium Priority

### Performance

- [ ] **Redis checkBatch: use pipelining** — MULTI/EXEC or pipelined EVALSHA.
- [ ] **PostgreSQL checkBatch: single query** — `WHERE key = ANY($1)`.

### Developer Experience

- [ ] **Add `invalidate(id)` to withCache** — Manual cache busting.
- [ ] **Document cache TTL guidance** — JSDoc: `ttlMs` should be <= smallest window.
- [x] **Add publint to CI** — Run on all publishable packages.

### Runtime Compatibility

- [ ] **Lower Node.js requirement** — Evaluate minimum version (18? 20?). `@ratelock/local` works in browsers.
- [ ] **Test Bun.js compatibility** — Verify all packages work under Bun runtime.
- [ ] **Clarify runtime messaging** — Update docs to reflect multi-runtime support (Node, Bun, browser for local).

---

## Low Priority

### Code Quality

- [x] **PostgreSQL sliding window: asymmetric remaining** — Fixed.
- [ ] **Add JSDoc to all exported functions** — IDE autocomplete and generated docs.
- [ ] **Expose circuit breaker state** — Getter for monitoring/observability.

### Infrastructure

- [x] **Add Renovate config** — Automated dependency updates.
- [ ] **Add package health badges to README** — Coverage, bundle size.

---

## Future / Ideas (Filtered & Prioritized)

### Framework Integrations (High Value)

- [ ] **Hono middleware** — `@ratelock/hono` — Lightweight, serverless-friendly, growing ecosystem
- [ ] **Express middleware** — `@ratelock/express` — Still the most widely used Node framework
- [ ] **Fastify plugin** — `@ratelock/fastify` — Performance-focused, strong community
- [ ] **Rate limit headers middleware** — Automatic `X-RateLimit-*` header injection (shared utility)

### New Adapters (Medium Value)

- [ ] **Cloudflare KV adapter** — `@ratelock/cloudflare` — Edge/serverless deployments
- [ ] **Upstash Redis adapter** — `@ratelock/upstash` — Serverless Redis with REST API
- [ ] **MongoDB adapter** — `@ratelock/mongo` — TTL indexes + findOneAndUpdate

### Bun Ecosystem (Explore, Don't Commit)

- [ ] **Bun.Redis driver support** — Add to `@ratelock/redis` once Lua scripts PR merges (low effort, high value)
- [ ] **Bun.sql driver support** — Evaluate if universal SQL client covers PostgreSQL-specific features needed
- [ ] **Dedicated Bun packages?** — Only if driver differences can't be handled within existing adapters

### Deno (Low Priority — Monitor)

- [ ] **Deno compatibility assessment** — Test existing packages, document gaps
- [ ] **Deno-specific adapters** — Only if demand justifies the maintenance cost

### Docs Design (Future Session)

- [ ] **Custom home page** — Hero section, feature cards, interactive demo, footer (Fumadocs HomeLayout replacement)
- [ ] **Interactive strategy simulation** — Extract from playground, embed in docs as MDX component
- [ ] **OG image generation** — Dynamic page preview images via `next/og` or Takumi

### Dashboard / Admin UI (Long Term)

- [ ] **Visual monitoring** — Rate limit state across adapters, real-time metrics
- [ ] **Management API** — CRUD for rate limit rules, manual overrides

---

## Notes

### Versioning

- Packages are currently at v0.2.0 but **nothing has been published yet**.
- Versions will be managed by Changesets on first publish.
- Internal packages (`test-utils`, `vitest`) use version `0.0.0` and are marked `private: true`.

### Runtime Support

- **Node.js**: Minimum version under evaluation (currently `>=22` in package.json, may be lowered)
- **Bun**: Expected compatible via Node.js API. Testing pending.
- **Browser**: `@ratelock/local` works in browsers (no Node-specific APIs)
- **Deno**: Unknown — assessment needed

### Port Conventions

- Redis test instance: **6380** (not default 6379)
- PostgreSQL test instance: **5434** (not default 5432)

### Decision Log

| Decision | Date | Rationale |
|----------|------|-----------|
| Decorators re-exported from adapters | 2026-05-19 | Users never install `@ratelock/core` directly. Built-in for simplicity, standalone for advanced cases. |
| Standalone decorators documented as "Advanced" | 2026-05-19 | Prevents confusion for new users while preserving flexibility for edge cases. |
| No dedicated Bun packages (yet) | 2026-05-19 | Add driver support to existing adapters first. Split only if differences can't be abstracted. |
| Framework integrations prioritized: Hono > Express > Fastify | 2026-05-19 | Hono is serverless-native and growing fast. Express for reach. Fastify for performance users. |
