# @ratelock/elysia

## 0.1.1

### Patch Changes

- [#24](https://github.com/saoudi-h/ratelock/pull/24) [`fe38252`](https://github.com/saoudi-h/ratelock/commit/fe38252c0128fbf1b5d0fe8b80f0040fdacaf35c) Thanks [@saoudi-h](https://github.com/saoudi-h)! - Migrate the toolchain from ESLint + Prettier to oxlint + oxfmt (`@tala-tools/oxlint` / `@tala-tools/oxfmt`) and adopt TypeScript 7 for typecheck. No runtime behavior change; distributed files are reformatted to the new formatter's output.

## 0.1.0

### Minor Changes

- [#18](https://github.com/saoudi-h/ratelock/pull/18) [`e051240`](https://github.com/saoudi-h/ratelock/commit/e0512404f2aa132fc59e9b44db360c48efa6ad89) Thanks [@saoudi-h](https://github.com/saoudi-h)! - Initial release: engine-agnostic rate limiting plugin for Elysia (>=1.1 <2), built on a global `onBeforeHandle` hook. Accepts any RateLock limiter instance or a lazy factory (deferred engine initialization). Dual-family headers (`RateLimit-*` RFC 9331 + legacy `X-RateLimit-*`, configurable), `Retry-After` on 429, `keyGenerator` override, Bun `requestIP` as default identifier.
