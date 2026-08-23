---
name: "ratelock"
type: "project"
status: "active"
---
# AGENT CONTEXT: ratelock

## 🧠 Context & Objectives

RateLock is a high-performance, extensible rate limiting library for Node.js and Bun (same source, no shims). Monorepo publishing `@ratelock/core`, `@ratelock/local`, `@ratelock/redis`, `@ratelock/postgres`; plus private tooling (`@ratelock/test-utils`, `@ratelock/vitest`, `@ratelock/bench`) and a docs app.

**Architecture:** core holds only contracts + composable resilience decorators (`withCache`, `withRetry`, `withCircuitBreaker`, `withFallback`) around the `Limiter<T>` interface (`check` / `checkBatch` / optional `destroy`). Each engine package exports one async factory per strategy (`fixedWindow`, `slidingWindow`, `tokenBucket`, `individualFixedWindow`) returning a decorated `Limiter<T>`. Cross-engine behavioral parity is enforced by contract tests in `packages/test-utils/src/contracts/*`, run against every engine. Users never install `@ratelock/core` directly; engines re-export its decorators.

## ⚙️ Workflow & Preferences

- **Commits:** Conventional Commits, enforced by husky `commit-msg` (commitlint). Allowed types: build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test.
- **Versioning:** pre-1.0 policy: the second digit is the effective major. Features ship as **patch** changesets by default; never bump the minor without an explicit maintainer decision. Breaking changes wait for the 1.0 train.
- **Changesets:** required for user-facing changes. No root `changeset` script; use `pnpm exec changeset`.
- **Definition of done (per CONTRIBUTING.md):** `pnpm build && pnpm lint && pnpm typecheck && pnpm test` all pass.
- **Cross-runtime policy:** a test passing on Node but failing on Bun is a real bug, not a flake.
- **Integration tests** (Redis/Postgres via Docker/testcontainers) run Node-only; Bun CI runs mock suites only.
- **Language:** English everywhere (code, docs, artifacts).

## 🏗 Stack & Architecture

- **Tooling:** pnpm@11 workspaces + Turborepo; TypeScript strict via `@tala-tools/tsconfig`, typechecked with **tsgo** (`@typescript/native-preview`; TS rewritten in Go). TS 7 is stable but the ecosystem hasn't fully adopted it yet: deliberate wait-and-see, do not migrate tooling to tsc 7 without an explicit decision. Builds via tsdown (ESM+CJS dual, publint on build); ESLint 10 + Prettier via shared `@tala-tools/*` presets; Vitest 4 with workspace projects composed from `@ratelock/vitest`; husky + lint-staged on pre-commit; Changesets + GitHub Actions publish from main.
- **Docs app:** Next.js 16 App Router + Fumadocs MDX, deployed on Vercel.
- **CI gates (`.github/workflows/ci.yml`):** unit tests on Node + Bun matrix; then build → lint → typecheck → publint over `packages/{core,local,redis,postgres}`. cspell is not in CI.

## 📁 Key Directories

| Path | Description |
|------|-------------|
| `packages/core` | Contracts (`Limiter<T>`, result/option types), decorators, errors, validators |
| `packages/local` | In-memory engine (zero deps, browser-safe) |
| `packages/redis` | Redis engine, Lua scripts, dual driver (node-redis / ioredis) |
| `packages/postgres` | Postgres engine, UPSERTs, drivers under `src/drivers/`, `migrations.ts`, `cleanup.ts` |
| `packages/test-utils` | Contract test suites asserting parity across engines |
| `packages/vitest` | Shared Vitest configs (base preset, workspace project globs) |
| `packages/bench` | Benchmark harness vs `rate-limiter-flexible`, docker compose for full runs |
| `apps/docs` | Documentation site (Fumadocs MDX content in `src/content/docs/`) |
| `.autonomos/` | Agent Protocol files |

## ⚠️ Known Constraints

- Root `pnpm test` starts Vitest in **watch mode**; use `vitest run` or `pnpm test:coverage` for one-shot. Turbo `test` has no `dependsOn: build`; build before testing.
- `next build` for the docs app sets `typescript.ignoreBuildErrors: true`; `pnpm typecheck` is the only TS gate.
- Docs env validation needs real values locally (`.env.local`, see `apps/docs/.env.example`); auto-skipped when `CI=true`.
- Non-default ports for integration infra: Redis **6380**, PostgreSQL **5434** (docker-compose inside package dirs). Intentional, test-only: avoids conflicts with other projects running on the maintainer's machine; do not "normalize" back to 6379/5432.
- All packages are published at v0.2 via Changesets (`release.yml` on main). Keep changesets flowing for user-facing changes.
- Untracked stale `dist/` and `coverage/` dirs may exist in packages; do not trust them as current state.
