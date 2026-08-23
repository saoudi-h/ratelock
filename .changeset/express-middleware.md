---
'@ratelock/express': minor
---

Initial release: engine-agnostic rate limiting middleware for Express, compatible with both Express 4 and 5. Accepts any RateLock limiter instance or a lazy factory (deferred engine initialization). Dual-family headers (`RateLimit-*` RFC 9331 + legacy `X-RateLimit-*`, configurable), `Retry-After` on 429, `keyGenerator` override, `req.ip` as default identifier honoring `trust proxy`.
