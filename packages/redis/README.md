# @ratelock/redis

> Distributed rate limiting powered by Redis and atomic Lua scripts.

[![npm version](https://img.shields.io/npm/v/@ratelock/redis.svg)](https://www.npmjs.com/package/@ratelock/redis)
[![License](https://img.shields.io/npm/l/@ratelock/redis.svg)](https://github.com/saoudi-h/ratelock/blob/main/LICENSE)

## When to Use

- Multi-server or serverless deployments
- When you need consistent rate limits across processes
- High-traffic applications requiring Redis-level performance
- When atomicity matters (no race conditions between checks)

## Installation

```bash
npm install @ratelock/redis redis
# or with ioredis
npm install @ratelock/redis ioredis
```

## Quick Start

### With a Connection URL

```typescript
import { createFixedWindowLimiter } from '@ratelock/redis'

const limiter = await createFixedWindowLimiter({
    url: 'redis://localhost:6379',
    limit: 100,
    windowMs: 60_000,
})
```

### With an Existing Client

```typescript
import { createClient } from 'redis'
import { createFixedWindowLimiter } from '@ratelock/redis'

const redisClient = createClient({ url: 'redis://localhost:6379' })
await redisClient.connect()

const limiter = await createFixedWindowLimiter({
    client: redisClient,
    limit: 100,
    windowMs: 60_000,
    prefix: 'my-app', // Optional key prefix
})
```

### With ioredis

```typescript
import IORedis from 'ioredis'
import { createFixedWindowLimiter } from '@ratelock/redis'

const limiter = await createFixedWindowLimiter({
    client: new IORedis('redis://localhost:6379'),
    limit: 100,
    windowMs: 60_000,
})
```

## Built-in Resilience

All Redis limiters support optional resilience layers:

```typescript
const limiter = await createFixedWindowLimiter({
    url: 'redis://localhost:6379',
    limit: 100,
    windowMs: 60_000,
    cache: { maxSize: 1000, ttlMs: 30_000 }, // Cache denied requests
    retry: { maxAttempts: 3 }, // Retry on transient errors
    circuitBreaker: { failureThreshold: 5 }, // Open circuit after failures
    errorPolicy: 'allow', // Fail-open policy
})
```

## All Strategies

```typescript
import {
    createFixedWindowLimiter,
    createSlidingWindowLimiter,
    createTokenBucketLimiter,
    createIndividualFixedWindowLimiter,
} from '@ratelock/redis'
```

## Cleanup

```typescript
await limiter.destroy() // Closes the Redis connection (if created internally)
```

## Documentation

Full API reference and guides at **[docs.ratelock.dev](https://docs.ratelock.dev)** _(coming soon)_.

## License

[MIT](./LICENSE)
