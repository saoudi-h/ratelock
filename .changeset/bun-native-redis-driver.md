---
'@ratelock/redis': patch
---

Add Bun native RedisClient as a first-class driver (requires Bun >= 1.4). The driver is auto-detected when a `RedisClient` instance is passed as `client`, or can be forced with `driver: 'bun'` using a connection URL — no npm dependency needed. Lua scripts run through the client's raw command API with automatic pipelining; benchmarks show it as the fastest Redis path available to RateLock.
