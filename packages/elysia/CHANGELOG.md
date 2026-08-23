# @ratelock/elysia

## 0.1.0

### Minor Changes

- [#18](https://github.com/saoudi-h/ratelock/pull/18) [`e051240`](https://github.com/saoudi-h/ratelock/commit/e0512404f2aa132fc59e9b44db360c48efa6ad89) Thanks [@saoudi-h](https://github.com/saoudi-h)! - Initial release: engine-agnostic rate limiting plugin for Elysia (>=1.1 <2), built on a global `onBeforeHandle` hook. Accepts any RateLock limiter instance or a lazy factory (deferred engine initialization). Dual-family headers (`RateLimit-*` RFC 9331 + legacy `X-RateLimit-*`, configurable), `Retry-After` on 429, `keyGenerator` override, Bun `requestIP` as default identifier.
