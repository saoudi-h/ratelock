# AGENT: packages/redis

- Engine backed by Redis Lua scripts for atomicity; dual driver support (node-redis / ioredis).
- Integration tests require Docker (Redis on port 6380) and run Node-only; the mock unit suite must stay Bun-safe.
- Parity contracts: `@ratelock/test-utils`: keep them green on any strategy change.
- Bun 1.4+: native `RedisClient` covers all needs (Lua via `send('EVAL'|'EVALSHA'|'SCRIPT', ['LOAD'])`, auto-pipelining replaces explicit pipelines, URL auth OK, RESP conversions correct). Planned as internal `'bun'` driver (BUN-02); no dedicated package. Gotcha: adapter pipelines call node-redis style `{keys, arguments}` objects, not positional args.
