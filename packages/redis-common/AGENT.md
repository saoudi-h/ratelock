# AGENT: packages/redis-common

- Private transport-neutral implementation of RateLock's Redis Lua strategies.
- Keep Node/Bun/HTTP client imports out of this package; adapters inject the minimal script client and disconnect function.
- Preserve the four strategy contracts and decorator order when changing shared code. Validate both `@ratelock/redis` and `@ratelock/upstash` after changes.
