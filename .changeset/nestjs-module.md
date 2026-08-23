---
'@ratelock/nestjs': minor
---

Initial release: engine-agnostic rate limiting module for NestJS 10 and 11. `RatelockModule.forRoot/forRootAsync` registers a global `APP_GUARD` (Express and Fastify adapters supported); routes opt out with `@SkipRateLimit()`. Accepts any RateLock limiter instance or a lazy factory. Dual-family headers (`RateLimit-*` RFC 9331 + legacy `X-RateLimit-*`, configurable), `Retry-After` on denial, `keyGenerator` override, `req.ip` as default identifier honoring trust-proxy settings.
