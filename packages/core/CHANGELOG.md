# @ratelock/core

## 0.2.0

### Minor Changes

- [#3](https://github.com/saoudi-h/ratelock/pull/3) [`60660bc`](https://github.com/saoudi-h/ratelock/commit/60660bc750809a534a4c7a8105fbb3be060c5ce4) Thanks [@saoudi-h](https://github.com/saoudi-h)! - # RateLock v0.2, A complete rewrite

        v0.2 is a clean-room rewrite of the entire library. The v0.1 layered
        architecture (`Storage` interface + `Strategy` + `BaseLimiterFactory` +
        `RateLimiter` class with configurable middlewares) is gone. In its place:
        a single `Limiter<T>` interface and a set of composable decorator
        functions. Every published package jumps from 0.1.x to 1.0.0 — the v0.2
        rewrite is the real public release.

        ## Breaking changes (migration required from v0.1)
        - **The v0.1 factory API is removed.** `createFixedWindowLimiter`,
          `createSlidingWindowLimiter`, `createTokenBucketLimiter`,
          `createIndividualFixedWindowLimiter` and their `{ limiter, storage,

    strategy }`return shape are gone. The`RateLimiter`class is gone.
    - **The`Storage`/`StoragePipeline`interfaces are removed.** Every
      adapter no longer implements a 40-method storage abstraction. There is
      no`RedisStorage`, no `StoragePipelineService`, no `CachedStorage`.
    - **The v0.1 `./factory`, `./limiter`, `./storage`, `./strategy`subpath
      exports on`@ratelock/core`are removed.** The package now has a single
      root entry plus`./package.json`.
    - **Resilience configuration moves out of `RateLimiter`.** The
      `performance?: { cache, batch, lazyCleanup }`and`resilience?: {
    retryConfig, circuitBreakerConfig }`knobs no longer exist. Retry and
      circuit breaker are no longer mutually exclusive — they are independent
      decorators that can be stacked in any order.
    - **Cross-runtime minimum is now Node 20 / Bun 1.1.** v0.1 declared
     `engines.node >= 16`; v0.2 declares `{ "node": ">=20", "bun": ">=1.1" }`
      and is tested on both runtimes in CI.
    - **`@ratelock/postgres`had no v0.1 release.** It ships for the first
      time in v0.2 and starts at 1.0.0.
    - **Logger injection is removed.** v0.1 strategies accepted an injected
     `Logger`; v0.2 has no logger concept.
    - **The v0.1 `apps/playground` is removed.\*\* Its interactive simulations
    live now inside the docs site as in-page MDX components.

        ## New architecture

        ### `@ratelock/core` — slim, types + decorators only

        The package collapses from six folders (`cache/`, `error/`, `factory/`,
        `limiter/`, `storage/`, `strategy/`) to eight files: `index.ts`,
        `types.ts`, `errors.ts`, `validate.ts`, `cache.ts`, `retry.ts`,
        `circuit-breaker.ts`, `fallback.ts`. No classes. The centerpiece is the
        8-line `Limiter<T>` interface and four composable decorators:
        - `withCache(limiter, { maxSize, ttlMs })` — DDoS Shield Architecture:
          caches **only** `allowed: false` results. Exposes `invalidate(id)` for
          manual cache busting (e.g. after admin action lifts a ban).
        - `withRetry(limiter, { maxAttempts, baseDelayMs?, maxDelayMs? })` —
          exponential backoff with randomised jitter to prevent thundering-herd.
        - `withCircuitBreaker(limiter, { failureThreshold, recoveryTimeoutMs? })`
          — closed → open → half-open state machine; throws
          `CircuitBreakerOpenError` while open.
        - `withFallback(limiter, 'throw' | 'allow' | 'deny', defaults?)` — wraps
          downstream errors into a `RatelockError` preserving `cause`.

        Because every decorator returns `Limiter<T>`, they compose freely:
        `withCache(withRetry(withFallback(limiter, 'deny'), { maxAttempts: 3 }),

    { maxSize: 1000, ttlMs: 30_000 })`. Inside each engine factory they are
    applied in a documented recommended order: `withFallback`→
   `withCircuitBreaker`→`withRetry`→`withCache` → underlying limiter.

        ### Standalone engines (each is a first-class citizen)

        Every engine exports four async functions named identically to the
        strategy. No shared `BaseLimiterFactory`, no `Storage` interface. Each
        engine speaks its backend's native language directly:
        - `@ratelock/local` — `Map<string, Entry>` with a cursor-based sweep
          (100 entries per 100 ops) to bound GC work. Zero dependencies, works in
          the browser.
        - `@ratelock/redis` — inline Lua scripts loaded via `SCRIPT LOAD` then
          `EVALSHA`, with a `NOSCRIPT` fallback. `adaptClient` auto-detects
          `node-redis` vs `ioredis` and adapts the API differences. `checkBatch`
          uses a pipeline for a single round-trip.
        - `@ratelock/postgres` — brand-new package. Dual driver support
          (`pgDriver(pool)` for node-postgres with FNV-1a named prepared
          statements, `postgresDriver(sql)` for porsager's `postgres`). Auto-
          migrations run inside a `BEGIN/COMMIT` transaction with legacy-schema
          detection. Auto-cleanup separates counter tables (5 min on
          `expires_at`) from the log-based `sliding_window` table (30 s on `ts`).
          `UNLOGGED` tables for max write throughput.

        ### `@ratelock/postgres` sliding window is log-based (parity with Redis)

        The PostgreSQL sliding window uses the same algorithm as `@ratelock/redis`
        (ZSET) and `@ratelock/local` (Map): one row per request, counted within a
        rolling `[now − windowMs, now]` window. The `ratelock.sliding_window`
        table is `(id BIGINT GENERATED ALWAYS AS IDENTITY, key TEXT, ts

    TIMESTAMPTZ, expires_at TIMESTAMPTZ)`with a`(key, ts)` BTree index. This
    guarantees identical semantics across all three engines.

        Measured on the v0.2 bench harness (pg driver, 80 workers, UNLOGGED):
        diverse throughput 22.4k ops/sec; extreme spam 22.3k ops/sec with a flat
        p99 of 7.4 ms (vs 15.9 ms for the previous counter-based approach). The
        counter-based approximation is gone.

        ## New packages

        ### `@ratelock/postgres` (first public release)

        PostgreSQL-backed rate limiting. Auto-migrations, auto-cleanup, dual
        driver support (`pg` and `postgres`), UNLOGGED option, log-based sliding
        window, atomic UPSERTs for fixed-window/token-bucket. The full table
        schemas are documented in `engines/postgres.mdx`; `cleanupExpired(driver,

    windowMs?)`and`startAutoCleanup(driver, windowMs?)` are exported.

        ### `@ratelock/bench` (internal, not published)

        A 7-matrix benchmarking suite added under `packages/bench`:
        - Matrix 1 — Local strategy & scenario comparison
        - Matrix 2 — Redis strategy & scenario comparison
        - Matrix 3 — Postgres strategy & scenario comparison
        - Matrix 4 — RateLock vs `rate-limiter-flexible` baseline
        - Matrix 5 — Driver & engine battle (`node-redis` vs `ioredis`, Redis 8
          vs Valkey 8, `pg` vs `porsager/postgres`)
        - Matrix 6 — Decorator performance overhead
        - Matrix 7 — Decorator resilience under fault injection (transient
          errors, latency spikes, hard-down backend via a Proxy wrapper)

        Ships with a `docker-compose.yml` (Redis 8, Valkey 8, Postgres 18) and
        reports to `results/benchmarks_raw.json` + `results/benchmark_report.md`.

        ### `apps/docs` (internal, not published)

        A Next.js 16 + Fumadocs documentation site replacing the v0.1
        README-only documentation:
        - Fumadocs MDX content collection organised into `getting-started/`,
          `strategies/`, `engines/`, `policies/`, `community/`.
        - `fumadocs-typescript` AutoTypeTable integration — every options table
          is generated from the actual `.ts` types, never hand-maintained.
        - Dynamic OG image generation per page via `next/og`.
        - `/llms.txt` and `/llms-full.txt` routes for LLM consumption.
        - Interactive in-page rate-limiting simulations running on
          `@ratelock/local` client-side.
        - GSAP-driven animations with bfcache replay hooks and Lenis smooth
          scroll.

        ## Contract-based testing

        `@ratelock/test-utils` ships four strategy contracts:
        `fixedWindowContract`, `slidingWindowContract`, `tokenBucketContract`,
        `individualFixedWindowContract`. Each is a self-contained `describe(...)`
        that asserts the strategy's observable behaviour against the contract
        result type. The contracts are run against every engine (local, redis,
        postgres with a `MockPgDriver`); the v0.1-era `storageContract` that
        tested storage primitives directly is removed. 83 unit tests + 23
        PostgreSQL integration tests pass on every PR.

        ## Cross-runtime support

        The source imports no Node.js built-in (`fs`, `path`, `crypto`,
        `worker_threads`). Optional drivers are loaded via conditional dynamic
        `import()`: `@ratelock/redis` works with either `redis` or `ioredis`
        installed, `@ratelock/postgres` works with either `pg` or `postgres`
        installed. Both are declared as peer-optional. The CI matrix
        runs `[node, bun]` on every PR.

## 0.1.1

### Patch Changes

- [`10fac0b`](https://github.com/saoudi-h/ratelock/commit/10fac0b8f4a77a0aa6c630987284f3554e12b460) Thanks [@saoudi-h](https://github.com/saoudi-h)! - Patch release adding missing description fields to package manifests and removing unused TypeScript type declarations.

## 0.1.0

### Minor Changes

- [`398232b`](https://github.com/saoudi-h/ratelock/commit/398232b11d4b0ff6e1e9e156191d8f543da35fb3) Thanks [@saoudi-h](https://github.com/saoudi-h)! - The official launch of RateLock! Featuring a high-performance core engine with extensible adapters for both local (in-memory) and Redis-backed distributed rate limiting.
