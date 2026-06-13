# RateLock

> A high-performance, extensible, and resilient rate limiting library for Node.js, Bun, and beyond.

[![Build Status](https://img.shields.io/github/actions/workflow/status/saoudi-h/ratelock/release.yml?branch=main&label=build)](https://github.com/saoudi-h/ratelock/actions)
[![License](https://img.shields.io/github/license/saoudi-h/ratelock)](https://github.com/saoudi-h/ratelock/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/@ratelock/local.svg)](https://www.npmjs.com/package/@ratelock/local)
[![Runtime](https://img.shields.io/badge/runtime-Node.js%20%7C%20Bun-4476A4)](https://github.com/saoudi-h/ratelock)

## What is RateLock?

RateLock is a modern rate limiting solution built for the real world. Whether you're running a single server or a distributed fleet, RateLock provides the tools to protect your APIs from abuse while keeping your code clean and maintainable.

### Why another rate limiter?

Most rate limiting libraries force you into a one-size-fits-all architecture. RateLock takes a different approach: **each storage adapter is a first-class citizen**, designed to leverage the unique strengths of its backend — Redis Lua scripts for atomicity, PostgreSQL UPSERTs for consistency, in-memory Maps for zero-overhead single-process apps. The same source runs on Node.js and Bun, with no shims and no runtime-only fallbacks.

## Quick Start

```typescript
import { createFixedWindowLimiter } from '@ratelock/local'

const limiter = await createFixedWindowLimiter({
  limit: 100,
  windowMs: 60_000, // 1 minute
})

const result = await limiter.check('user:123')

if (!result.allowed) {
  return new Response('Too Many Requests', { status: 429 })
}
```

## Packages

| Package | Description | Best For |
|---------|-------------|----------|
| [`@ratelock/local`](packages/local/) | Zero-dependency in-memory adapter | Single-process apps, development |
| [`@ratelock/redis`](packages/redis/) | Redis adapter with Lua scripts | Distributed systems, high traffic |
| [`@ratelock/postgres`](packages/postgres/) | PostgreSQL adapter with UPSERTs | Apps already using Postgres |

## Core Features

- **Cross-runtime**: Same source on Node.js 22+ and Bun 1.1+, tested on every PR
- **4 rate limiting strategies**: Fixed Window, Sliding Window, Token Bucket, Individual Fixed Window
- **Built-in resilience**: Retry with backoff, circuit breaker, error policies, deny cache
- **TypeScript first**: Full type safety, no `any` leaks
- **Dual driver support**: Redis (node-redis or ioredis), PostgreSQL (pg or porsager/postgres)
- **Batch operations**: Check multiple identifiers in a single call

## Documentation

For full documentation, guides, and API reference, visit **[ratelock.vercel.app](https://ratelock.vercel.app)**.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

[MIT](./LICENSE) — Hakim Saoudi
