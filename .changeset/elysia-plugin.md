---
'@ratelock/elysia': minor
---

Initial release: engine-agnostic rate limiting plugin for Elysia (>=1.1 <2), built on a global `onBeforeHandle` hook. Accepts any RateLock limiter instance or a lazy factory (deferred engine initialization). Dual-family headers (`RateLimit-*` RFC 9331 + legacy `X-RateLimit-*`, configurable), `Retry-After` on 429, `keyGenerator` override, Bun `requestIP` as default identifier.
