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
import { fixedWindow } from '@ratelock/redis'

const limiter = await fixedWindow({
    url: 'redis://localhost:6379',
    limit: 100,
    windowMs: 60_000,
})
```

### With an Existing Client

```typescript
import { createClient } from 'redis'
import { fixedWindow } from '@ratelock/redis'

const redisClient = createClient({ url: 'redis://localhost:6379' })
await redisClient.connect()

const limiter = await fixedWindow({
    client: redisClient,
    limit: 100,
    windowMs: 60_000,
    prefix: 'my-app', // Optional key prefix
})
```

### With ioredis

```typescript
import IORedis from 'ioredis'
import { fixedWindow } from '@ratelock/redis'

const limiter = await fixedWindow({
    client: new IORedis('redis://localhost:6379'),
    limit: 100,
    windowMs: 60_000,
})
```

## Built-in Resilience

All Redis limiters support optional resilience layers:

```typescript
const limiter = await fixedWindow({
    url: 'redis://localhost:6379',
    limit: 100,
    windowMs: 60_000,
    cache: { maxSize: 1000, ttlMs: 30_000 }, // Cache denied requests
    retry: { maxAttempts: 3 }, // Retry on transient errors
    circuitBreaker: { failureThreshold: 5 }, // Open circuit after failures
    fallback: 'allow', // Fail-open policy
})
```

## All Strategies

```typescript
import { fixedWindow, slidingWindow, tokenBucket, individualFixedWindow } from '@ratelock/redis'
```

## Cleanup

```typescript
await limiter.destroy() // Closes the Redis connection (if created internally)
```

## Documentation

Full API reference and guides at **[ratelock.vercel.app](https://ratelock.vercel.app)**.

## License

[MIT](./LICENSE)
