# @ratelock/hono

## 0.1.0

### Minor Changes

- [#11](https://github.com/saoudi-h/ratelock/pull/11) [`a892804`](https://github.com/saoudi-h/ratelock/commit/a892804cc8855cde46f9f0b2482c8f4faf0f373f) Thanks [@saoudi-h](https://github.com/saoudi-h)! - Initial release: engine-agnostic rate limiting middleware for Hono. Accepts any RateLock limiter instance or a lazy factory (deferred engine initialization for edge/cold-start sensitive deployments). Dual-family headers (`RateLimit-*` RFC 9331 + legacy `X-RateLimit-*`, configurable), `Retry-After` on 429, `keyGenerator` override, framework-provided remote address as default identifier.
