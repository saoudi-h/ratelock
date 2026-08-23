# @ratelock/elysia

> Rate limiting plugin for [Elysia](https://elysiajs.com) (>=1.1 <2). Bring any RateLock limiter; the plugin stays engine-agnostic.

## Why

RateLock engines (`@ratelock/local`, `@ratelock/redis`, `@ratelock/postgres`) expose limiters; this package turns any of them into an Elysia plugin through a global `onBeforeHandle` hook. Designed for Bun-first deployments and pairs naturally with the native Bun Redis driver of `@ratelock/redis`.

## Install

```bash
bun add @ratelock/elysia @ratelock/local   # or @ratelock/redis, @ratelock/postgres
```

## Quick start

```typescript
import { Elysia } from 'elysia'
import { rateLimit } from '@ratelock/elysia'
import { fixedWindow } from '@ratelock/redis'

const app = new Elysia().use(
    rateLimit({
        // Lazy factory: the engine initializes on the first matched request.
        limiter: () => fixedWindow({ url: process.env.REDIS_URL!, limit: 100, windowMs: 60_000 }),
        limit: 100, // only used for the *Limit headers
        keyGenerator: ({ request }) => request.headers.get('x-user-id') ?? 'anon',
    })
)
```

Already have an instance? Pass it directly:

```typescript
const limiter = await fixedWindow({ limit: 100, windowMs: 60_000 })
new Elysia().use(rateLimit({ limiter }))
```

## Options

| Option           | Type                                             | Default               | Description                                                                                                          |
| ---------------- | ------------------------------------------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `limiter`        | `Limiter` or `() => Limiter \| Promise<Limiter>` | **required**          | Any RateLock limiter. A factory is memoized and invoked once, on the first matched request.                          |
| `keyGenerator`   | `(context) => string \| Promise<string>`         | Bun `requestIP`       | Identifier the request is counted against. Falls back to a shared `'anonymous'` bucket when no address is available. |
| `headers`        | `'both' \| 'rfc' \| 'legacy' \| false`           | `'both'`              | `RateLimit-*` (RFC 9331) and/or `X-RateLimit-*` families.                                                            |
| `limit`          | `number`                                         | (none)                | Quota, used only to emit the `*Limit` headers (results do not carry it).                                             |
| `denyStatusCode` | `number`                                         | `429`                 | Status returned when the quota is exhausted.                                                                         |
| `message`        | `string`                                         | `'Too Many Requests'` | JSON body of the denial response.                                                                                    |

Denial responses include `Retry-After` (seconds) whenever the result exposes a reset/refill time.

## Headers

| Family      | Headers                                                           |
| ----------- | ----------------------------------------------------------------- |
| RFC 9331    | `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`       |
| Legacy      | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |
| Denial only | `Retry-After`                                                     |

`RateLimit-Reset` is always expressed in seconds. Token bucket results project `floor(tokens)` onto `Remaining` and the refill time onto `Reset`.

## Identifiers and proxies

The default key reads the Bun server's `requestIP(request)`. Behind a proxy or load balancer, configure your deployment accordingly or provide a `keyGenerator`. Never trust a raw `x-forwarded-for` header from untrusted clients: it is trivially spoofable.

## License

[MIT](./LICENSE) · Hakim Saoudi
