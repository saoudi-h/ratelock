# @ratelock/upstash

> Edge-compatible rate limiting backed by Upstash Redis over HTTP.

[![npm version](https://img.shields.io/npm/v/@ratelock/upstash.svg)](https://www.npmjs.com/package/@ratelock/upstash)
[![License](https://img.shields.io/npm/l/@ratelock/upstash.svg)](https://github.com/saoudi-h/ratelock/blob/main/LICENSE)

## When to use it

Use `@ratelock/upstash` when your application runs in a serverless or Edge
runtime and needs shared rate-limit state. It uses the official
`@upstash/redis` REST client, so it does not open a TCP socket or depend on
Node.js Redis drivers.

Use [`@ratelock/redis`](../redis/) for a long-lived Node.js or Bun process with
a connection-oriented Redis client. Both packages expose the same limiter
contract and the same four strategies.

## Installation

```bash
npm install @ratelock/upstash @upstash/redis
# or
pnpm add @ratelock/upstash @upstash/redis
```

`@upstash/redis` is a peer dependency. Keep the standard REST token on the
server side and provide it through your runtime's secret manager:

```bash
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-secret-token
```

## Quick start

```typescript
import { Redis } from '@upstash/redis'
import { fixedWindow } from '@ratelock/upstash'

const redis = Redis.fromEnv()

const limiter = await fixedWindow({
    client: redis,
    limit: 100,
    windowMs: 60_000,
    prefix: 'api',
})

const result = await limiter.check('user:123')
```

The adapter accepts an existing `Redis` client. It deliberately does not
accept a URL and token directly, keeping credential parsing and environment
handling inside the official Upstash SDK.

Cloudflare Workers and Pages should use the provider-specific entry point:

```typescript
import { Redis } from '@upstash/redis/cloudflare'

const redis = Redis.fromEnv(env)
```

Other serverless environments can use the standard `@upstash/redis` entry
point shown above. The RateLock adapter only relies on the shared REST command
surface, so both clients are accepted.

## Edge and serverless handlers

The limiter can be initialized at module scope and reused by warm isolates:

```typescript
import { Redis } from '@upstash/redis'
import { fixedWindow } from '@ratelock/upstash'

const limiterPromise = fixedWindow({
    client: Redis.fromEnv(),
    limit: 100,
    windowMs: 60_000,
})

export default async function handler(request: Request): Promise<Response> {
    const limiter = await limiterPromise
    const id = request.headers.get('x-user-id') ?? 'anonymous'
    const result = await limiter.check(id)

    const headers = {
        'RateLimit-Remaining': String(result.remaining),
        'RateLimit-Reset': String(Math.ceil((result.reset - Date.now()) / 1000)),
    }

    if (!result.allowed) {
        return new Response('Too Many Requests', {
            status: 429,
            headers: {
                ...headers,
                'Retry-After': headers['RateLimit-Reset'],
            },
        })
    }

    return new Response('OK', { headers })
}
```

For Cloudflare module workers, bindings arrive through the `env` argument.
Use the Cloudflare entry point and memoize the limiter for the warm isolate:

```typescript
import { Redis } from '@upstash/redis/cloudflare'
import { fixedWindow } from '@ratelock/upstash'

type Env = {
    UPSTASH_REDIS_REST_URL: string
    UPSTASH_REDIS_REST_TOKEN: string
}

let limiterPromise: ReturnType<typeof fixedWindow> | undefined

function getLimiter(env: Env) {
    return (limiterPromise ??= fixedWindow({
        client: Redis.fromEnv(env),
        limit: 100,
        windowMs: 60_000,
    }))
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const limiter = await getLimiter(env)
        const result = await limiter.check(request.headers.get('x-user-id') ?? 'anonymous')
        return new Response(result.allowed ? 'OK' : 'Too Many Requests', {
            status: result.allowed ? 200 : 429,
            headers: { 'RateLimit-Remaining': String(result.remaining) },
        })
    },
}
```

For a framework-specific recipe, see the [Upstash engine guide](https://ratelock.vercel.app/docs/engines/upstash) and the [framework recipes](https://ratelock.vercel.app/docs/integrations/framework-recipes).

## Strategies

```typescript
import { fixedWindow, slidingWindow, tokenBucket, individualFixedWindow } from '@ratelock/upstash'
```

| Factory                 | Use case                                                      |
| ----------------------- | ------------------------------------------------------------- |
| `fixedWindow`           | Low-overhead quotas aligned to epoch windows                  |
| `slidingWindow`         | Rolling windows without boundary bursts                       |
| `tokenBucket`           | Controlled bursts with a steady refill rate                   |
| `individualFixedWindow` | A separate window starting on each identifier's first request |

All factories return the same `Limiter` interface as the other RateLock
engines. They support `check`, `checkBatch`, and the standard result fields.

## Resilience policies

Configure the built-in policies on any factory:

```typescript
const limiter = await fixedWindow({
    client: Redis.fromEnv(),
    limit: 100,
    windowMs: 60_000,
    cache: { maxSize: 1000, ttlMs: 30_000 },
    retry: { maxAttempts: 3 },
    circuitBreaker: { failureThreshold: 5, recoveryTimeoutMs: 30_000 },
    fallback: 'allow',
})
```

The package also re-exports `withCache`, `withRetry`,
`withCircuitBreaker`, and `withFallback` for standalone composition.

## Batch checks and atomicity

`checkBatch` sends its script calls through one Upstash HTTP pipeline. Upstash
preserves pipeline order, but a pipeline is not a transaction: commands from
other clients can interleave between calls. Each individual Lua invocation is
still atomic, so a single identifier cannot observe a partially applied
strategy operation.

## Lifecycle

```typescript
await limiter.destroy()
```

Calling `destroy()` is safe, but it is intentionally a no-op. The REST client
does not own a TCP socket for RateLock to close, and the client instance
remains under your application's control.

## Documentation

Full guides and API reference are available at
**[ratelock.vercel.app](https://ratelock.vercel.app)**.

## License

[MIT](./LICENSE) · Hakim Saoudi
