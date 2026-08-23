# @ratelock/fastify

## 0.1.0

### Minor Changes

- [#15](https://github.com/saoudi-h/ratelock/pull/15) [`1bb3952`](https://github.com/saoudi-h/ratelock/commit/1bb3952ad97313581e305896b01c72dc2071b772) Thanks [@saoudi-h](https://github.com/saoudi-h)! - Initial release: engine-agnostic rate limiting plugin for Fastify, compatible with both Fastify 4 and 5. Wrapped in fastify-plugin so the onRequest hook applies across encapsulation scopes. Accepts any RateLock limiter instance or a lazy factory (deferred engine initialization). Dual-family headers (`RateLimit-*` RFC 9331 + legacy `X-RateLimit-*`, configurable), `Retry-After` on 429, `keyGenerator` override, `request.ip` as default identifier honoring `trustProxy`.
