# RateLock Core (`@ratelock/core`)

<p align="center">
  <img src="https://raw.githubusercontent.com/saoudi-h/ratelock/main/apps/playground/public/logo.svg" alt="RateLock Logo" width="50">
</p>

<p align="center">
  <strong>The foundational engine for the RateLock ecosystem.</strong>
</p>

---

> **Internal Package: Do Not Use Directly**
>
> `@ratelock/core` is a foundational package that provides the core functionalities and APIs for all official RateLock adapters. It is published to NPM to serve as a dependency for other `@ratelock` packages (like `@ratelock/redis` or `@ratelock/local`).
>
> **You should not install or use this package directly in your application.** Please choose a ready-to-use adapter that fits your needs.

## About RateLock Core

This package contains the heart of the RateLock system, including:

- The main `RateLimiter` class.
- The standard `Storage` interface.
- Base implementations for all official rate limiting strategies.

## Available Strategies

`@ratelock/core` provides the logic for four distinct rate limiting strategies:

- **Fixed Window**: The classic, memory-efficient strategy.
- **Sliding Window**: A more accurate strategy that avoids bursts at the edges of windows.
- **Token Bucket**: A flexible strategy that allows for bursts of traffic.
- **Individual Fixed Window**: A variation of the fixed window strategy with individualized tracking.

While this package provides base implementations, official adapters like `@ratelock/redis` contain optimized versions of these strategies that leverage the atomic operations of their specific storage backend for maximum performance and accuracy.

## 📜 License

This project is licensed under the MIT License.
