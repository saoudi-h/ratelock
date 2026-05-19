# @ratelock/local

> Zero-dependency, in-memory rate limiting. Perfect for single-process applications.

[![npm version](https://img.shields.io/npm/v/@ratelock/local.svg)](https://www.npmjs.com/package/@ratelock/local)
[![License](https://img.shields.io/npm/l/@ratelock/local.svg)](https://github.com/saoudi-h/ratelock/blob/main/LICENSE)

## When to Use

- Single-server or single-process deployments
- Development and testing environments
- When you want zero external dependencies
- When sub-millisecond latency matters

## Installation

```bash
npm install @ratelock/local
```

## Quick Start

### Fixed Window

```typescript
import { createFixedWindowLimiter } from '@ratelock/local'

const limiter = await createFixedWindowLimiter({
    limit: 100,
    windowMs: 60_000, // 1 minute
})

const result = await limiter.check('user:123')
// { allowed: true, remaining: 99, reset: 1716000060000 }
```

### Sliding Window

```typescript
import { createSlidingWindowLimiter } from '@ratelock/local'

const limiter = await createSlidingWindowLimiter({
    limit: 100,
    windowMs: 60_000,
})
```

### Token Bucket

```typescript
import { createTokenBucketLimiter } from '@ratelock/local'

const limiter = await createTokenBucketLimiter({
    capacity: 10, // Max burst size
    refillRate: 1, // Tokens per second
})
```

### Individual Fixed Window

```typescript
import { createIndividualFixedWindowLimiter } from '@ratelock/local'

const limiter = await createIndividualFixedWindowLimiter({
    limit: 10,
    windowMs: 60_000,
})
```

## Using the Result

```typescript
const result = await limiter.check('user:123')

if (!result.allowed) {
    return new Response('Too Many Requests', {
        status: 429,
        headers: {
            'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
        },
    })
}
```

## Batch Checks

```typescript
const results = await limiter.checkBatch(['user:1', 'user:2', 'user:3'])
```

## Cleanup

```typescript
await limiter.destroy() // Clears internal state
```

## Documentation

Full API reference and guides at **[docs.ratelock.dev](https://docs.ratelock.dev)** _(coming soon)_.

## License

[MIT](./LICENSE)
