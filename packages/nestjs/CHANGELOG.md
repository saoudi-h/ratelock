# @ratelock/nestjs

## 0.1.1

### Patch Changes

- [#24](https://github.com/saoudi-h/ratelock/pull/24) [`fe38252`](https://github.com/saoudi-h/ratelock/commit/fe38252c0128fbf1b5d0fe8b80f0040fdacaf35c) Thanks [@saoudi-h](https://github.com/saoudi-h)! - Migrate the toolchain from ESLint + Prettier to oxlint + oxfmt (`@tala-tools/oxlint` / `@tala-tools/oxfmt`) and adopt TypeScript 7 for typecheck. No runtime behavior change; distributed files are reformatted to the new formatter's output.

## 0.1.0

### Minor Changes

- [#22](https://github.com/saoudi-h/ratelock/pull/22) [`b4551b4`](https://github.com/saoudi-h/ratelock/commit/b4551b4f41a2e204541502d775460bfc03338d78) Thanks [@saoudi-h](https://github.com/saoudi-h)! - Initial release: engine-agnostic rate limiting module for NestJS 10 and 11. `RatelockModule.forRoot/forRootAsync` registers a global `APP_GUARD` (Express and Fastify adapters supported); routes opt out with `@SkipRateLimit()`. Accepts any RateLock limiter instance or a lazy factory. Dual-family headers (`RateLimit-*` RFC 9331 + legacy `X-RateLimit-*`, configurable), `Retry-After` on denial, `keyGenerator` override, `req.ip` as default identifier honoring trust-proxy settings.
