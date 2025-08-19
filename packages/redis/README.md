# RateLock Redis (`@ratelock/redis`)

<p align="center">
  <strong>A high-performance, distributed rate limiter for Node.js, powered by Redis.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@ratelock/redis"><img src="https://img.shields.io/npm/v/@ratelock/redis.svg" alt="NPM Version"></a>
  <a href="https://github.com/saoudi-h/ratelock/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@ratelock/redis.svg" alt="License"></a>
</p>

---

`@ratelock/redis` provides a robust, distributed rate limiting solution using Redis as a backend. It's the ideal choice for applications running in a multi-server or serverless environment, ensuring consistent rate limiting across your entire infrastructure.

## ✨ Key Features

- **🌐 Distributed & Scalable:** Reliably enforce rate limits across any number of servers or processes.
- **🚀 High Performance:** Leverages the speed of Redis and uses optimized Lua scripts for atomic operations, preventing race conditions and ensuring maximum performance.
- **🛡️ Consistent State:** Provides a single source of truth for rate limit counters, no matter where the request is handled.
- **⚙️ Simple API:** Get started quickly with a clean, factory-based API similar to other RateLock adapters.
- **💪 Resilient:** Built to handle enterprise-level traffic and benefits from Redis's stability.

## 📦 Installation

This package has a peer dependency on `redis`. You need to install both:

```bash
npm install @ratelock/redis redis
# or
yarn add @ratelock/redis redis
# or
pnpm add @ratelock/redis redis
```

## 🚀 Getting Started

Here is a basic example of how to create a **Fixed Window** rate limiter connected to your Redis instance.

```typescript
import { createClient } from 'redis'
import { createFixedWindowLimiter } from '@ratelock/redis'

// 1. Create and connect your Redis client
const redisClient = createClient({
    // Your Redis configuration
    url: 'redis://localhost:6379',
})
await redisClient.connect()

// 2. Create the rate limiter, passing the client to the storage config
const { limiter } = await createFixedWindowLimiter({
    strategy: {
        limit: 15, // Allow 15 requests
        windowMs: 60000, // per 60 seconds
    },
    storage: {
        client: redisClient,
        // Optional prefix for all keys stored in Redis
        prefix: 'my-app-ratelimit',
    },
})

// 3. Use the limiter in your application (e.g., with Fastify)
server.get('/api/protected', async (request, reply) => {
    const userId = request.ip
    const result = await limiter.check(userId)

    if (!result.allowed) {
        return reply.status(429).send({ message: 'Too Many Requests' })
    }

    reply.header('X-RateLimit-Limit', result.limit)
    reply.header('X-RateLimit-Remaining', result.remaining)

    return { message: 'You have access!' }
})
```

## 🤖 Atomic Operations with Lua

To ensure the highest level of performance and prevent race conditions, `@ratelock/redis` implements all core logic in pre-loaded Lua scripts. This guarantees that operations like incrementing a counter are atomic, meaning they are performed as a single, indivisible operation within Redis.

## 📚 Strategies

You can easily create a limiter for any supported strategy by importing its dedicated factory function:

- `createFixedWindowLimiter`
- `createSlidingWindowLimiter`
- `createTokenBucketLimiter`
- `createIndividualFixedWindowLimiter`

## 📜 License

This project is licensed under the MIT License.
