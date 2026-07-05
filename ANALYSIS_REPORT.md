# Technical Analysis Report

> Generated: 2026-05-19
> Scope: Core decorators, Redis sliding window, batch operations

---

## 1. Circuit Breaker — Potential Bug

**File:** `packages/core/src/circuit-breaker.ts`

### Observed behavior

The circuit breaker transitions through three states: `closed` → `open` → `half-open` → `closed`.

When the circuit is `open`, any call to `check()` or `checkBatch()` throws `Error('Circuit breaker is open')` immediately unless `recoveryTimeoutMs` has elapsed, in which case it transitions to `half-open` and lets one request through as a probe.

### Issue: Error message loses original context

When the circuit is `open` and a request is rejected, the thrown error is a generic string:

```typescript
throw new Error('Circuit breaker is open')
```

This discards any information about *why* the circuit opened (the original error that caused the threshold to be reached). Consumers cannot distinguish between "the downstream service is down" vs "the downstream service is timing out" vs any other root cause.

### Issue: Half-open probe succeeds but batch may partially fail

In `checkBatch()`, if the circuit is `half-open` and the batch call succeeds, the circuit closes and `failureCount` resets to 0. However, if the batch call *partially* succeeds but throws (e.g., some IDs fail validation), the entire batch counts as **one** failure — even though some individual checks may have succeeded. This is by design (batch is atomic from the circuit breaker's perspective), but it's worth noting.

### Issue: No concurrency guard on state transitions

If two concurrent calls arrive while the circuit is `open` and `recoveryTimeoutMs` has elapsed, both will transition to `half-open` simultaneously and both will call through to the underlying limiter. The circuit breaker is designed to let only one probe request through, but without a lock on the state transition, multiple probes can slip through under concurrency.

**Severity:** Medium — affects accuracy of the circuit breaker pattern under concurrent load.

**Reproduction scenario:**
1. Circuit opens after `failureThreshold` consecutive errors.
2. Wait `recoveryTimeoutMs`.
3. Fire 10 concurrent `check()` calls simultaneously.
4. All 10 will see `state === 'open'` and `Date.now() - lastFailureTime >= recoveryTimeoutMs`, so all 10 will set `state = 'half-open'` and proceed to call the underlying limiter.

### Recommendations

| Priority | Action |
|----------|--------|
| High | Wrap the original error in the "circuit open" error using `{ cause: err }` so consumers can inspect the root cause |
| Medium | Add a simple boolean flag (`isProbing`) to ensure only one request acts as the half-open probe |
| Low | Consider exposing circuit state via a getter for monitoring/observability |

---

## 2. withCache — Deny-Only Caching

**File:** `packages/core/src/cache.ts`

### Observed behavior

The cache **only** stores entries where `allowed === false` (denied requests):

```typescript
if (typeof result === 'object' && 'allowed' in result && result.allowed === false) {
    set(id, result)
}
```

Allowed requests are never cached — they always hit the underlying limiter.

### This is intentional and correct

This design is sound for rate limiting:
- **Denied requests** are safe to cache because the rate limit state won't change within the TTL — the user is still blocked.
- **Allowed requests** must NOT be cached because each allowed request consumes a token/increment a counter. Caching an "allowed" result would skip the consumption step, allowing the user to exceed their limit.

### Potential concern: Stale deny cache

If a user is denied and the result is cached for `ttlMs`, they will continue to receive "denied" even after their window has reset or tokens have refilled, **until the cache entry expires**. This means the `ttlMs` should be set carefully — ideally no larger than the smallest window duration in use.

**Severity:** Low — by design, but deserves documentation.

### Recommendations

| Priority | Action |
|----------|--------|
| Low | Add a JSDoc comment on `CacheConfig.ttlMs` warning that it should be <= the smallest window duration |
| Low | Consider adding an `invalidate(id: string)` method to the cached limiter for manual cache busting |

---

## 3. checkBatch — Non-Atomic Sequential Execution

**Files:** All adapter `checkBatch` implementations

### Observed behavior

Every adapter implements `checkBatch` as:

```typescript
checkBatch(ids: string[]): Promise<T[]> {
    return Promise.all(ids.map(id => limiter.check(id)))
}
```

This executes individual `check()` calls in parallel via `Promise.all`.

### Issue: Not truly batched

For distributed backends (Redis, PostgreSQL), this means:
- **N separate round-trips** to the server instead of one batched call
- **No atomicity** across IDs — if the batch is meant to represent a single logical operation, partial failures can leave inconsistent state
- For Redis specifically, this bypasses the opportunity to use `EVALSHA` with pipelining or `MULTI/EXEC`

### Issue: Race conditions in local adapter

For the in-memory (`@ratelock/local`) adapter, `Promise.all` means concurrent checks on the **same ID** within a batch could read stale state:

```typescript
await limiter.checkBatch(['user:1', 'user:1'])
```

Both calls read the Map entry simultaneously before either writes, potentially allowing 2 requests when only 1 should be allowed.

**Severity:** Medium for local adapter, Low for distributed adapters (each individual check is still atomic, just not the batch as a whole).

### Recommendations

| Priority | Action |
|----------|--------|
| Medium | For Redis: implement true batch via `MULTI/EXEC` or pipelined `EVALSHA` calls |
| Medium | For PostgreSQL: use a single query with `WHERE key = ANY($1)` for batch checks |
| Low | For local: deduplicate IDs in batch and process sequentially per-key to avoid race conditions |

---

## 4. Redis Sliding Window — Incorrect `windowStart`

**File:** `packages/redis/src/sliding-window.ts:71`

### Observed behavior

```typescript
return {
    allowed: Number(res[0]) === 1,
    remaining: Number(res[2]),
    reset: now + Number(res[3]),
    windowStart: now - windowMs,    // <-- PROBLEM
    windowEnd: now + Number(res[3]),
}
```

`windowStart` is calculated as `now - windowMs`, which is a fixed offset from the current time. This does **not** represent the actual start of the sliding window.

### The problem

In a true sliding window, `windowStart` should be the timestamp of the **oldest entry** still within the window (i.e., the oldest member of the sorted set that has a score > `now - windowMs`). The Lua script has access to this information via `ZRANGE key 0 0 WITHSCORES` but does not return it.

The current implementation returns a value that is always exactly `windowMs` in the past, regardless of when the first request in the window was actually made.

### Impact

- Consumers using `windowStart` to display "window started at X" will see incorrect information
- The `windowEnd` calculation (`now + Number(res[3])`) uses the TTL from Redis, which is correct
- Rate limiting accuracy is **not** affected — the Lua script correctly manages the sorted set

### Recommendations

| Priority | Action |
|----------|--------|
| Medium | Modify the Lua script to return the oldest timestamp in the sorted set via `ZRANGE key 0 0 WITHSCORES` |
| Low | If the oldest entry doesn't exist (empty set), fall back to `now - windowMs` as a sensible default |

**Example fix for the Lua script:**
```lua
-- After ZREMRANGEBYSCORE and before returning:
local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
local oldest_ts = #oldest > 0 and tonumber(oldest[2]) or (now - window)
-- Include oldest_ts in the return array
```

---

## 5. PostgreSQL Sliding Window — Estimated Count Logic

**File:** `packages/postgres/src/sliding-window.ts:86`

### Observed behavior

```typescript
const elapsed = (now - windowStart) / windowMs
const estimated = row.previous_count * (1 - elapsed) + row.current_count
const allowed = Math.floor(estimated) <= limit
```

The PostgreSQL sliding window uses a **weighted interpolation** between `previous_count` and `current_count` to estimate the current request count. This is a valid approach for sliding windows without per-request timestamps.

### Potential concern

The `allowed` check uses `Math.floor(estimated) <= limit`, but the `remaining` calculation uses `limit - Math.ceil(estimated)`. This asymmetry means there could be a case where `allowed === true` but `remaining === 0`, which is semantically confusing.

**Severity:** Low — edge case, unlikely to cause real issues.

---

## Summary of Severity

| Issue | Severity | Effort to Fix |
|-------|----------|---------------|
| Circuit breaker: lost error context | Medium | Low |
| Circuit breaker: concurrent half-open probes | Medium | Low |
| checkBatch: non-atomic, N round-trips | Medium | Medium |
| Redis sliding window: incorrect windowStart | Medium | Low |
| withCache: stale deny cache | Low (by design) | N/A |
| PostgreSQL sliding window: asymmetric remaining | Low | Low |
| Local checkBatch: same-ID race condition | Medium | Low |
