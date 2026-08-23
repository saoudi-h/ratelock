# @ratelock/express

> Rate limiting middleware for Express 4 and 5. Bring any RateLock limiter; the middleware stays engine-agnostic.

## Why

RateLock engines (`@ratelock/local`, `@ratelock/redis`, `@ratelock/postgres`) expose limiters; this package turns any of them into Express middleware. Zero runtime dependencies beyond Express itself. Swap engines without touching your routes.

## Install

```bash
pnpm add @ratelock/express @ratelock/local   # or @ratelock/redis, @ratelock/postgres
```

## Quick start

```typescript
import express from 'express'
import { rateLimit } from '@ratelock/express'
import { fixedWindow } from '@ratelock/redis'

const app = express()

app.use(
    '/api',
    rateLimit({
        // Lazy factory: the engine initializes on the first matched request.
        limiter: () => fixedWindow({ url: process.env.REDIS_URL!, limit: 100, windowMs: 60_000 }),
        limit: 100, // only used for the *Limit headers
        keyGenerator: req => req.ip ?? 'anon',
    })
)

app.get('/api/things', (_req, res) => res.json({ things: [] }))
```

Already have an instance? Pass it directly:

```typescript
const limiter = await fixedWindow({ limit: 100, windowMs: 60_000 })
app.use('/api', rateLimit({ limiter }))
```

## Express 4 and 5

One package covers both majors. The middleware always forwards async failures through `next(err)`, which Express 4 requires and Express 5 appreciates. Tested against both majors on every change.

## Options

| Option           | Type                                             | Default               | Description                                                                                                         |
| ---------------- | ------------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `limiter`        | `Limiter` or `() => Limiter \| Promise<Limiter>` | **required**          | Any RateLock limiter. A factory is memoized and invoked once, on the first matched request.                         |
| `keyGenerator`   | `(req: Request) => string \| Promise<string>`    | `req.ip`              | Identifier the request is counted against. Falls back to a shared `'anonymous'` bucket when the address is unknown. |
| `headers`        | `'both' \| 'rfc' \| 'legacy' \| false`           | `'both'`              | `RateLimit-*` (RFC 9331) and/or `X-RateLimit-*` families.                                                           |
| `limit`          | `number`                                         | (none)                | Quota, used only to emit the `*Limit` headers (results do not carry it).                                            |
| `denyStatusCode` | `number`                                         | `429`                 | Status returned when the quota is exhausted.                                                                        |
| `message`        | `string`                                         | `'Too Many Requests'` | JSON body of the denial response.                                                                                   |

Denial responses include `Retry-After` (seconds) whenever the result exposes a reset/refill time.

## Headers

| Family      | Headers                                                           |
| ----------- | ----------------------------------------------------------------- |
| RFC 9331    | `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`       |
| Legacy      | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |
| Denial only | `Retry-After`                                                     |

`RateLimit-Reset` is always expressed in seconds. Token bucket results project `floor(tokens)` onto `Remaining` and the refill time onto `Reset`.

## Identifiers and proxies

The default key reads `req.ip`, which honors your app's `trust proxy` setting. Behind a proxy without trust configuration, every client shares the proxy's address and one bucket. Set `trust proxy` correctly or provide a `keyGenerator`. Never read raw `x-forwarded-for` yourself: attackers forge it per-request to bypass limits.

## License

[MIT](./LICENSE) · Hakim Saoudi
