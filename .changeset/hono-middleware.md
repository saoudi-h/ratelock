---
'@ratelock/hono': minor
---

Initial release: engine-agnostic rate limiting middleware for Hono. Accepts any RateLock limiter instance or a lazy factory (deferred engine initialization for edge/cold-start sensitive deployments). Dual-family headers (`RateLimit-*` RFC 9331 + legacy `X-RateLimit-*`, configurable), `Retry-After` on 429, `keyGenerator` override, framework-provided remote address as default identifier.
