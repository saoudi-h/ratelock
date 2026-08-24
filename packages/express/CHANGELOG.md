# @ratelock/express

## 0.1.1

### Patch Changes

- [#24](https://github.com/saoudi-h/ratelock/pull/24) [`fe38252`](https://github.com/saoudi-h/ratelock/commit/fe38252c0128fbf1b5d0fe8b80f0040fdacaf35c) Thanks [@saoudi-h](https://github.com/saoudi-h)! - Migrate the toolchain from ESLint + Prettier to oxlint + oxfmt (`@tala-tools/oxlint` / `@tala-tools/oxfmt`) and adopt TypeScript 7 for typecheck. No runtime behavior change; distributed files are reformatted to the new formatter's output.

## 0.1.0

### Minor Changes

- [#13](https://github.com/saoudi-h/ratelock/pull/13) [`f375ab9`](https://github.com/saoudi-h/ratelock/commit/f375ab95707691f2364fcd6489c1d4df09b8229b) Thanks [@saoudi-h](https://github.com/saoudi-h)! - Initial release: engine-agnostic rate limiting middleware for Express, compatible with both Express 4 and 5. Accepts any RateLock limiter instance or a lazy factory (deferred engine initialization). Dual-family headers (`RateLimit-*` RFC 9331 + legacy `X-RateLimit-*`, configurable), `Retry-After` on 429, `keyGenerator` override, `req.ip` as default identifier honoring `trust proxy`.
