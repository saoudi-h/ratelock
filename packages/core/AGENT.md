# AGENT: packages/core

- Slim contract + decorators package. `src/types.ts` defines `Limiter<T>` (the entire engine contract); decorators are pure `(Limiter<T>) => Limiter<T>` functions. No strategy or storage implementations here.
- Decorator order is semantically significant. Recommended inner→outer: `withFallback` → `withCircuitBreaker` → `withRetry` → `withCache`. Cache outermost so its `invalidate()` survives; retry/circuit-breaker/fallback drop it.
- `withCache` memoizes only denied results (TTL + insertion-order eviction; `ttlMs` must be ≤ smallest window in use).
- Flat `src/`, single barrel `src/index.ts`. Tests in top-level `tests/<module>.test.ts`, real timers (no fake clocks).
- Strict TS with `verbatimModuleSyntax`: always `import type` for types.
- Cross-strategy behavior contracts live in `packages/test-utils/src/contracts/*`, not here.
