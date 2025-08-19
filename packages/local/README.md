# RateLock Local (`@ratelock/local`)

<p align="center">
  <svg width="50" height="50" viewBox="0 0 425 620" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="6" y="273" width="413" height="341" rx="61" stroke="currentColor" stroke-width="12"/>
<rect x="6" y="273" width="413" height="341" rx="61" stroke="currentColor" stroke-width="12"/>
<rect x="6" y="273" width="413" height="341" rx="61" stroke="currentColor" stroke-width="12"/>
<rect x="6" y="273" width="413" height="341" rx="61" stroke="currentColor" stroke-width="12"/>
<path d="M365.774 308.01C381.985 308.421 395 321.69 395 338V370.5C395 372.985 392.985 375 390.5 375V375C388.015 375 386 372.985 386 370.5V338C386 326.402 376.598 317 365 317H62C50.402 317 41 326.402 41 338V370.5C41 372.985 38.9853 375 36.5 375V375C34.0147 375 32 372.985 32 370.5V338C32 321.69 45.0149 308.421 61.2256 308.01L62 308H365L365.774 308.01Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M214.465 6C304.191 6 379.641 78.6002 376.929 168.066C376.575 179.747 376.755 188.823 373.176 197.756C369.596 206.689 360.843 213 350.611 213C337.422 213 326.688 202.516 326.327 189.446C325.966 176.377 327.699 176.416 327.329 168.066C324.578 105.946 276.798 55.478 214.465 55.478C152.131 55.478 104.354 105.946 101.6 168.066C101.23 176.416 102.601 189.446 102.601 189.446C102.24 202.516 91.5072 213 78.3182 213C68.0857 213 59.3319 206.689 55.7524 197.756C52.1729 188.823 52 168.066 52 168.066C52 78.5594 124.738 6 214.465 6Z" stroke="currentColor" stroke-width="11"/>
<line x1="81" y1="347" x2="81" y2="369" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>
<line x1="110" y1="347" x2="110" y2="369" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>
<line x1="140" y1="347" x2="140" y2="369" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>
<line x1="170" y1="347" x2="170" y2="369" stroke="#DB1A1A" stroke-width="10" stroke-linecap="round"/>
<circle cx="351" cy="185" r="13" fill="#DB1A1A"/>
<rect x="334" y="542" width="20" height="20" fill="#DB1A1A"/>
<rect x="36.5" y="515.5" width="354" height="72" rx="25.5" stroke="currentColor" stroke-width="9"/>
<path d="M75.5 542H173.5M75.5 562.5H173.5" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>
<rect x="36.5" y="407.5" width="354" height="72" rx="25.5" stroke="currentColor" stroke-width="9"/>
<path d="M75.5 434H173.5M75.5 454.5H173.5" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>
</svg>
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
