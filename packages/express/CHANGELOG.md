# @ratelock/express

## 0.1.0

### Minor Changes

- [#13](https://github.com/saoudi-h/ratelock/pull/13) [`f375ab9`](https://github.com/saoudi-h/ratelock/commit/f375ab95707691f2364fcd6489c1d4df09b8229b) Thanks [@saoudi-h](https://github.com/saoudi-h)! - Initial release: engine-agnostic rate limiting middleware for Express, compatible with both Express 4 and 5. Accepts any RateLock limiter instance or a lazy factory (deferred engine initialization). Dual-family headers (`RateLimit-*` RFC 9331 + legacy `X-RateLimit-*`, configurable), `Retry-After` on 429, `keyGenerator` override, `req.ip` as default identifier honoring `trust proxy`.
