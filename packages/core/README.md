# @ratelock/core

> The foundational engine of the RateLock ecosystem.

[![npm version](https://img.shields.io/npm/v/@ratelock/core.svg)](https://www.npmjs.com/package/@ratelock/core)
[![License](https://img.shields.io/npm/l/@ratelock/core.svg)](https://github.com/saoudi-h/ratelock/blob/main/LICENSE)

---

> **Note:** `@ratelock/core` is primarily an internal package. You typically don't need to install it directly - it's pulled in automatically by storage adapters like `@ratelock/local`, `@ratelock/redis`, and `@ratelock/postgres`.

## What's Inside

This package provides the shared types, validation utilities, and composable decorators that power all RateLock adapters:

### Types

- `Limiter<T>` - The universal limiter interface
- `FixedWindowResult`, `SlidingWindowResult`, `TokenBucketResult` - Result types for each strategy
- `FixedWindowOptions`, `SlidingWindowOptions`, `TokenBucketOptions` - Configuration types

### Decorators

Wrap any limiter with additional behavior:

```typescript
import { withCache, withRetry, withCircuitBreaker, withFallback } from '@ratelock/core'

let limiter = await fixedWindow({ limit: 100, windowMs: 60_000 })

// Cache denied requests to reduce backend load
limiter = withCache(limiter, { maxSize: 1000, ttlMs: 30_000 })

// Retry transient failures with exponential backoff
limiter = withRetry(limiter, { maxAttempts: 3, baseDelayMs: 100 })

// Open the circuit after 5 consecutive failures
limiter = withCircuitBreaker(limiter, { failureThreshold: 5, recoveryTimeoutMs: 30_000 })

// Fail-open: allow requests when the backend is unreachable
limiter = withFallback(limiter, 'allow')
```

### Validation

```typescript
import {
    validateFixedWindowOptions,
    validateSlidingWindowOptions,
    validateTokenBucketOptions,
} from '@ratelock/core'

validateFixedWindowOptions({ limit: 100, windowMs: 60_000 }) // throws RangeError if invalid
```

## Installation

```bash
npm install @ratelock/core
```

## Documentation

Full API reference and guides at **[ratelock.vercel.app](https://ratelock.vercel.app)**.

## License

[MIT](./LICENSE)
