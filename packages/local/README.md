# RateLock Local (`@ratelock/local`)

<p align="center">
  <img src="https://raw.githubusercontent.com/saoudi-h/ratelock/main/apps/playground/public/logo.svg" alt="RateLock Logo" width="50">
</p>

<p align="center">
  <strong>A simple, fast, zero-dependency rate limiter for Node.js. Perfect for single-process applications.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@ratelock/local"><img src="https://img.shields.io/npm/v/@ratelock/local.svg" alt="NPM Version"></a>
  <a href="https://github.com/saoudi-h/ratelock/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@ratelock/local.svg" alt="License"></a>
</p>

---

`@ratelock/local` provides an efficient, in-memory rate limiting solution. Because it runs in the same process as your application without any external dependencies, it's incredibly fast and easy to set up.

## ✨ Key Features

- **🚀 Blazing Fast:** In-memory storage means no network latency.
- **👌 Zero Dependencies:** No need to set up a database or external cache.
- **⚙️ Simple API:** Get started in minutes with a clean and modern factory-based API.
- **🛡️ All Strategies Included:** Supports all standard RateLock strategies (Fixed Window, Sliding Window, etc.) out of the box.
- **💧 Lightweight:** Adds minimal overhead to your application.

## 🤔 When should I use it?

`@ratelock/local` is the perfect choice for:

- Rate limiting on a single server or process.
- Development and testing environments.
- Small to medium-sized applications where a distributed setup is not required.

If you are running your application in a distributed environment (e.g., multiple servers, serverless functions), you should use an adapter with a shared storage backend, like **[`@ratelock/redis`](#)**.

## 📦 Installation

```bash
npm install @ratelock/local
# or
yarn add @ratelock/local
# or
pnpm add @ratelock/local
```

## 🚀 Getting Started

Here is a basic example of how to create a **Fixed Window** rate limiter that allows 10 requests every 60 seconds.

```typescript
import { createFixedWindowLimiter } from '@ratelock/local'

// 1. Create the rate limiter
const { limiter } = await createFixedWindowLimiter({
    strategy: {
        limit: 10, // Allow 10 requests
        windowMs: 60000, // per 60 seconds
    },
})

// 2. Use the limiter in your application (e.g., with Express)
app.get('/api/protected', async (req, res) => {
    const userId = req.ip // Or user ID, API key, etc.
    const result = await limiter.check(userId)

    if (!result.allowed) {
        return res.status(429).send('Too Many Requests')
    }

    res.setHeader('X-RateLimit-Limit', result.limit)
    res.setHeader('X-RateLimit-Remaining', result.remaining)

    res.send('You have access!')
})
```

## 📚 Strategies

You can easily create a limiter for any supported strategy by importing its dedicated factory function:

- `createFixedWindowLimiter`
- `createSlidingWindowLimiter`
- `createTokenBucketLimiter`
- `createIndividualFixedWindowLimiter`

Each factory accepts a `strategy` configuration object tailored to that specific algorithm.

## 📜 License

This project is licensed under the MIT License.
