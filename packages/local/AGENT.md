# AGENT: packages/local

- In-memory engine, zero runtime dependencies, no Node built-ins (browser-safe).
- Same engine shape as all engines: one file + async factory per strategy (`fixedWindow`, `slidingWindow`, `tokenBucket`, `individualFixedWindow`), composing core decorators fallback → circuitBreaker → retry → cache.
- Behavioral parity with other engines is asserted by `@ratelock/test-utils` contract suites — any behavior change must keep those green.
