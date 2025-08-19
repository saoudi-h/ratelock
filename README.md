# RateLock

<p align="center">
  <img src="https://raw.githubusercontent.com/ratelock/ratelock/main/apps/playground/public/logo.svg" alt="RateLock Logo" width="250">
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
