# @ratelock/nestjs

> Rate limiting module for NestJS 10 and 11 — engine-agnostic guard powered by any RateLock limiter.

## Why

RateLock engines (`@ratelock/local`, `@ratelock/redis`, `@ratelock/postgres`) expose limiters; this package wraps any of them in a NestJS dynamic module and an application-wide guard. Works with both the Express and Fastify adapters. Zero runtime dependencies beyond `@nestjs/common` and `@nestjs/core` peers.

## Install

```bash
pnpm add @ratelock/nestjs @ratelock/local   # or @ratelock/redis, @ratelock/postgres
```

## Quick start

```typescript
import { Module } from '@nestjs/common'
import { RatelockModule } from '@ratelock/nestjs'
import { fixedWindow } from '@ratelock/redis'

@Module({
    imports: [
        RatelockModule.forRoot({
            // Lazy factory: the engine initializes on the first guarded request.
            limiter: () =>
                fixedWindow({ url: process.env.REDIS_URL!, limit: 100, windowMs: 60_000 }),
            limit: 100, // only used for the *Limit headers
            keyGenerator: req => req.ip ?? 'anon',
        }),
    ],
})
export class AppModule {}
```

Async configuration through your config service:

```typescript
RatelockModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (config: ConfigService) => ({
        limiter: () =>
            fixedWindow({
                url: config.get('REDIS_URL')!,
                limit: config.get('RATE_LIMIT'),
                windowMs: 60_000,
            }),
    }),
})
```

Already have an instance? Pass it directly:

```typescript
const limiter = await fixedWindow({ limit: 100, windowMs: 60_000 })
RatelockModule.forRoot({ limiter })
```

The module is global and binds the guard application-wide via `APP_GUARD`. Exempt individual routes or controllers with `@SkipRateLimit()`.

```typescript
import { SkipRateLimit } from '@ratelock/nestjs'

@Get('/health')
@SkipRateLimit()
health() {
    return { status: 'up' }
}
```

Prefer manual binding? Pass `globalGuard: false` and attach `RatelockGuard` per-module or per-route (`@UseGuards(RatelockGuard)`).

## Options

| Option           | Type                                             | Default               | Description                                                                                          |
| ---------------- | ------------------------------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `limiter`        | `Limiter` or `() => Limiter \| Promise<Limiter>` | **required**          | Any RateLock limiter. A factory is memoized and invoked once, on the first guarded request.          |
| `keyGenerator`   | `(req) => string \| Promise<string>`             | `req.ip`              | Identifier the request is counted against. Falls back to a shared `'anonymous'` bucket when unknown. |
| `headers`        | `'both' \| 'rfc' \| 'legacy' \| false`           | `'both'`              | `RateLimit-*` (RFC 9331) and/or `X-RateLimit-*` families.                                            |
| `limit`          | `number`                                         | (none)                | Quota, used only to emit the `*Limit` headers (results do not carry it).                             |
| `denyStatusCode` | `number`                                         | `429`                 | Status of the denial exception.                                                                      |
| `message`        | `string`                                         | `'Too Many Requests'` | JSON body carried by the denial exception.                                                           |
| `globalGuard`    | `boolean`                                        | `true`                | Register through `APP_GUARD`. Set `false` for per-route `@UseGuards(RatelockGuard)` binding.         |

Denial responses include `Retry-After` (seconds) whenever the result exposes a reset/refill time. Denials throw a NestJS `HttpException`, so your existing exception filters shape them.

## Headers

| Family      | Headers                                                           |
| ----------- | ----------------------------------------------------------------- |
| RFC 9331    | `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`       |
| Legacy      | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |
| Denial only | `Retry-After`                                                     |

`RateLimit-Reset` is always expressed in seconds. Token bucket results project `floor(tokens)` onto `Remaining` and the refill time onto `Reset`.

## Identifiers and proxies

The default key reads `request.ip`, available on both adapters and honoring their trust-proxy settings (`app.set('trust proxy')` on Express, `trustProxy` on Fastify). Behind a proxy without trust configuration, every client shares one bucket. Set trust correctly or provide a `keyGenerator`. Never read raw `x-forwarded-for` yourself: attackers forge it per-request to bypass limits.

## License

[MIT](./LICENSE) · Hakim Saoudi
