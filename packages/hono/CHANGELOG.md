# @ratelock/hono

## 0.1.1

### Patch Changes

- [#24](https://github.com/saoudi-h/ratelock/pull/24) [`fe38252`](https://github.com/saoudi-h/ratelock/commit/fe38252c0128fbf1b5d0fe8b80f0040fdacaf35c) Thanks [@saoudi-h](https://github.com/saoudi-h)! - Migrate the toolchain from ESLint + Prettier to oxlint + oxfmt (`@tala-tools/oxlint` / `@tala-tools/oxfmt`) and adopt TypeScript 7 for typecheck. No runtime behavior change; distributed files are reformatted to the new formatter's output.

## 0.1.0

### Minor Changes

- [#11](https://github.com/saoudi-h/ratelock/pull/11) [`a892804`](https://github.com/saoudi-h/ratelock/commit/a892804cc8855cde46f9f0b2482c8f4faf0f373f) Thanks [@saoudi-h](https://github.com/saoudi-h)! - Initial release: engine-agnostic rate limiting middleware for Hono. Accepts any RateLock limiter instance or a lazy factory (deferred engine initialization for edge/cold-start sensitive deployments). Dual-family headers (`RateLimit-*` RFC 9331 + legacy `X-RateLimit-*`, configurable), `Retry-After` on 429, `keyGenerator` override, framework-provided remote address as default identifier.
