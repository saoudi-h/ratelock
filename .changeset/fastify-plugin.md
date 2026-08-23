---
'@ratelock/fastify': minor
---

Initial release: engine-agnostic rate limiting plugin for Fastify, compatible with both Fastify 4 and 5. Wrapped in fastify-plugin so the onRequest hook applies across encapsulation scopes. Accepts any RateLock limiter instance or a lazy factory (deferred engine initialization). Dual-family headers (`RateLimit-*` RFC 9331 + legacy `X-RateLimit-*`, configurable), `Retry-After` on 429, `keyGenerator` override, `request.ip` as default identifier honoring `trustProxy`.
