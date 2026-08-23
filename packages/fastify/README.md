# @ratelock/fastify

> Rate limiting plugin for Fastify 4 and 5. Bring any RateLock limiter; the plugin stays engine-agnostic.

## Why

RateLock engines (`@ratelock/local`, `@ratelock/redis`, `@ratelock/postgres`) expose limiters; this package turns any of them into a Fastify plugin. Wrapped with `fastify-plugin`, it applies to routes registered anywhere in the instance, including child encapsulation scopes. Zero runtime dependencies beyond `fastify-plugin` itself.

## Install

```bash
pnpm add @ratelock/fastify @ratelock/local   # or @ratelock/redis, @ratelock/postgres
```

## Quick start

```typescript
import Fastify from 'fastify'
import { rateLimit } from '@ratelock/fastify'
import { fixedWindow } from '@ratelock/redis'

const app = Fastify({ trustProxy: true })

await app.register(rateLimit, {
    // Lazy factory: the engine initializes on the first matched request.
    limiter: () => fixedWindow({ url: process.env.REDIS_URL!, limit: 100, windowMs: 60_000 }),
    limit: 100, // only used for the *Limit headers
    keyGenerator: request => request.ip,
})
```

Already have an instance? Pass it directly:

```typescript
const limiter = await fixedWindow({ limit: 100, windowMs: 60_000 })
await app.register(rateLimit, { limiter })
```

The plugin registers an `onRequest` hook, the earliest point in the Fastify lifecycle. Note that global hooks run even on unmatched paths, so lazy initialization happens on the first request of any kind after boot.

## Options

| Option           | Type                                                     | Default               | Description                                                                                                         |
| ---------------- | -------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `limiter`        | `Limiter` or `() => Limiter \| Promise<Limiter>`         | **required**          | Any RateLock limiter. A factory is memoized and invoked once, on the first matched request.                         |
| `keyGenerator`   | `(request: FastifyRequest) => string \| Promise<string>` | `request.ip`          | Identifier the request is counted against. Falls back to a shared `'anonymous'` bucket when the address is unknown. |
| `headers`        | `'both' \| 'rfc' \| 'legacy' \| false`                   | `'both'`              | `RateLimit-*` (RFC 9331) and/or `X-RateLimit-*` families.                                                           |
| `limit`          | `number`                                                 | (none)                | Quota, used only to emit the `*Limit` headers (results do not carry it).                                            |
| `denyStatusCode` | `number`                                                 | `429`                 | Status returned when the quota is exhausted.                                                                        |
| `message`        | `string`                                                 | `'Too Many Requests'` | JSON body of the denial response.                                                                                   |

Denial responses include `Retry-After` (seconds) whenever the result exposes a reset/refill time.

## Headers

| Family      | Headers                                                           |
| ----------- | ----------------------------------------------------------------- |
| RFC 9331    | `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`       |
| Legacy      | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |
| Denial only | `Retry-After`                                                     |

`RateLimit-Reset` is always expressed in seconds. Token bucket results project `floor(tokens)` onto `Remaining` and the refill time onto `Reset`.

## Identifiers and proxies

The default key reads `request.ip`, which honors your server's `trustProxy` option. Behind a proxy without trust configuration, every client shares the proxy's address and one bucket. Set `trustProxy` correctly or provide a `keyGenerator`. Never read raw `x-forwarded-for` yourself: attackers forge it per-request to bypass limits.

## License

[MIT](./LICENSE) · Hakim Saoudi
