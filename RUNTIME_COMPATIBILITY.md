# Runtime Compatibility

> Target runtimes for the RateLock ecosystem.

---

## Node.js

**Status: Primary target — fully supported**

- **Minimum version:** 22
- **Tested versions:** 22, 24, 26
- All packages are designed and tested for Node.js first.

### Notes

- Uses native ESM (`"type": "module"`)
- Dual CJS/ESM exports via tsdown
- `setTimeout.unref()` used for background cleanup (Node.js specific, Bun-compatible)

---

## Bun

**Status: Planned — expected full compatibility**

- Bun implements the Node.js module API, so all RateLock packages should work out of the box.
- The `setTimeout.unref()` call used in PostgreSQL auto-cleanup is supported by Bun.
- **Action needed:** Run the full test suite under Bun and document any issues.

### Testing Checklist

- [ ] Run `@ratelock/local` tests under Bun
- [ ] Run `@ratelock/redis` tests under Bun (with Redis container)
- [ ] Run `@ratelock/postgres` tests under Bun (with PostgreSQL container)
- [ ] Verify `tsdown` builds work correctly when consumed by a Bun project

---

## Deno

**Status: Planned — requires evaluation**

- Deno has a Node.js compatibility layer (`npm:` specifiers), but it may not cover all edge cases.
- Key concerns:
  - `npm:` specifier resolution for workspace packages
  - `setTimeout.unref()` support in Deno
  - Dynamic `import()` behavior for driver detection (redis/ioredis, pg/postgres)

### Evaluation Tasks

- [ ] Test importing `@ratelock/local` via `npm:@ratelock/local`
- [ ] Test importing `@ratelock/redis` with a Deno Redis client
- [ ] Assess whether a Deno-specific entry point is needed
- [ ] Document any required polyfills or workarounds

---

## Edge Runtimes

**Status: Not currently targeted**

- Cloudflare Workers, Vercel Edge, Deno Deploy have limited Node.js API support.
- A future `@ratelock/edge` package could target these via KV stores or Durable Objects.
- The current packages are **not expected to work** in edge runtimes without modification.
