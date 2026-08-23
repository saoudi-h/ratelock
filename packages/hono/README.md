# @ratelock/hono

> Rate limiting middleware for [Hono](https://hono.dev). Bring any RateLock limiter; the middleware stays engine-agnostic.

[![npm version](https://img.shields.io/npm/v/@ratelock/hono.svg)](https://www.npmjs.com/package/@ratelock/hono)

## Why

RateLock engines (`@ratelock/local`, `@ratelock/redis`, `@ratelock/postgres`) expose limiters; this package turns any of them into Hono middleware. Zero runtime dependencies beyond Hono itself. Bring your own limiter and swap engines without touching your routes.

## Install

```bash
pnpm add @ratelock/hono @ratelock/local   # or @ratelock/redis, @ratelock/postgres
```

## Quick start

```typescript
import { Hono } from 'hono'
import { rateLimit } from '@ratelock/hono'
import { fixedWindow } from '@ratelock/redis'

const app = new Hono()

app.use(
    '/api/*',
    rateLimit({
        // Lazy factory: the engine initializes on the first matched request,
        // keeping cold starts free (great for edge/serverless).
        limiter: () => fixedWindow({ url: process.env.REDIS_URL!, limit: 100, windowMs: 60_000 }),
        limit: 100, // only used for the *Limit headers
        keyGenerator: c => c.req.header('x-user-id') ?? 'anon',
    })
)

app.get('/api/things', c => c.json({ things: [] }))
```

Already have an instance? Pass it directly:

```typescript
const limiter = await fixedWindow({ limit: 100, windowMs: 60_000 })
app.use('/api/*', rateLimit({ limiter }))
```

## Options

| Option           | Type                                             | Default               | Description                                                                                                                 |
| ---------------- | ------------------------------------------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `limiter`        | `Limiter` or `() => Limiter \| Promise<Limiter>` | **required**          | Any RateLock limiter. A factory is memoized and invoked once, on the first matched request.                                 |
| `keyGenerator`   | `(c: Context) => string \| Promise<string>`      | remote address        | Identifier the request is counted against. Falls back to a shared `'anonymous'` bucket when the runtime exposes no address. |
| `headers`        | `'both' \| 'rfc' \| 'legacy' \| false`           | `'both'`              | `RateLimit-*` (RFC 9331) and/or `X-RateLimit-*` families.                                                                   |
| `limit`          | `number`                                         | (none)                | Quota, used only to emit the `*Limit` headers (results do not carry it).                                                    |
| `denyStatusCode` | `ContentfulStatusCode`                           | `429`                 | Status returned when the quota is exhausted.                                                                                |
| `message`        | `string`                                         | `'Too Many Requests'` | JSON body of the denial response.                                                                                           |

Denial responses include `Retry-After` (seconds) whenever the result exposes a reset/refill time.

## Headers

| Family      | Headers                                                           |
| ----------- | ----------------------------------------------------------------- |
| RFC 9331    | `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`       |
| Legacy      | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |
| Denial only | `Retry-After`                                                     |

`RateLimit-Reset` is always expressed in seconds. Token bucket results project `floor(tokens)` onto `Remaining` and the refill time onto `Reset`.

## Identifiers and proxies

The default key uses the runtime-provided remote address (Node socket, Bun `requestIP`, Deno `remoteAddr`). Behind a proxy or load balancer, that address belongs to your proxy, so every client would share one bucket. Configure your framework's trust settings or provide a `keyGenerator` (API key, authenticated user id) instead. Never trust a raw `x-forwarded-for` header from untrusted clients: it is trivially spoofable.

## License

[MIT](./LICENSE) · Hakim Saoudi
