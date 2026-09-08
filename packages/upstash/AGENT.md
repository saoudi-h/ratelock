# AGENT: packages/upstash

- Edge/serverless adapter over the official `@upstash/redis` HTTP client; the published bundle must not import Node Redis drivers, sockets, or runtime-specific globals.
- Keep the public surface aligned with `@ratelock/redis`: four strategy factories, the same result contracts, and the same resilience decorators.
- Upstash pipelines preserve command order but are not atomic transactions. Lua remains the atomic unit for each identifier; do not describe `checkBatch` as a cross-key transaction.
- Unit tests use a local Upstash-shaped fake. The default integration command uses the documented local Serverless Redis HTTP bridge with Docker; real-service tests remain opt-in with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Never put credentials in the repository or CI defaults.
