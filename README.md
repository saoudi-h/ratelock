# RateLock

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
  <strong>A high-performance, extensible, and resilient rate limiting library for Node.js.</strong>
</p>

<p align="center">
    <a href="#"><img src="https://img.shields.io/github/actions/workflow/status/saoudi-h/ratelock/release.yml?branch=main&label=build" alt="Build Status"></a>
    <a href="https://github.com/saoudi-h/ratelock/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@ratelock/core.svg" alt="License"></a>
</p>

---

RateLock is a powerful and developer-friendly rate limiting solution for Node.js applications. It's designed to be fast, flexible, and easy to integrate into any project, from small services to large-scale distributed systems.

## ✨ Core Philosophy

- **Extensibility:** RateLock is built around a core engine and modular storage adapters. This allows you to choose the right backend for your needs or even build your own.
- **Performance:** By leveraging atomic operations (like Redis Lua scripts) in its adapters, RateLock ensures that rate limiting checks are fast and free of race conditions.
- **Developer Experience:** With a clean, modern API and strong TypeScript support, RateLock is designed to be intuitive and easy to work with.

## 📦 Packages

This monorepo contains the entire RateLock ecosystem. The primary user-facing packages are:

| Package               | Version                                                                                                           | Description                                                                                    |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **`@ratelock/local`** | [![NPM Version](https://img.shields.io/npm/v/@ratelock/local.svg)](https://www.npmjs.com/package/@ratelock/local) | A zero-dependency, in-memory adapter. Perfect for single-process applications and development. |
| **`@ratelock/redis`** | [![NPM Version](https://img.shields.io/npm/v/@ratelock/redis.svg)](https://www.npmjs.com/package/@ratelock/redis) | A high-performance adapter using Redis for distributed rate limiting across multiple servers.  |

For detailed usage and installation instructions, please see the `README.md` file within each package's directory.

## 🚀 Playground

This repository includes a playground application in the `apps/playground` directory. It's a Next.js application designed to demonstrate and test the various rate limiting strategies in a visual way.

To run the playground:

```bash
pnpm dev
```

## 🛠️ Contributing & Development

We welcome contributions! To get started with development, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/saoudi-h/ratelock.git
    cd ratelock
    ```

2.  **Install dependencies:**
    This project uses `pnpm` as its package manager.

    ```bash
    pnpm install
    ```

3.  **Build all packages:**
    This monorepo is managed by Turborepo. To build all packages and applications:

    ```bash
    pnpm build
    ```

4.  **Run tests:**
    To run the test suite for the entire project:
    ```bash
    pnpm test
    ```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
