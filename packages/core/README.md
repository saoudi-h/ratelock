# RateLock Core (`@ratelock/core`)

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
