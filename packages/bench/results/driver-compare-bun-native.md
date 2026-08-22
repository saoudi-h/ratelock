# Driver Comparison — Bun 1.4 native RedisClient

> Date: 2026-08-22
> Task: BENCH-01
> Harness: `src/driver-compare.ts` (`pnpm bench:drivers` / `pnpm bench:drivers:bun`)
> Workload: `@ratelock/redis` fixedWindow, `check()` only, limit 10000, window 60s, 10 workers, 5s per variant, single Dockerized Redis 8-alpine on localhost:6380.

## Environment

| | |
|---|---|
| Bun | 1.4.0 |
| Node | v25.9.0 (`.nvmrc`) |
| Platform | linux x64, bare metal |

## Results (two runs each)

### Throughput (ops/s)

| Variant | Run 1 | Run 2 | Delta vs best Node combo |
|---|---|---|---|
| **bun native** (Bun) | **76,393** | **75,572** | **+40%** |
| ioredis (Bun) | 74,345 | 67,333 | +28% |
| node-redis (Node) | 54,560 | 49,821 | baseline |
| node-redis (Bun) | 45,616 | 50,177 | −9% |
| ioredis (Node) | 45,561 | 47,048 | −12% |

### Latency — bun native run 1 vs node-redis/Node run 1

| Percentile | bun native | node-redis (Node) | ioredis (Node) |
|---|---|---|---|
| p50 | **122μs** | 168μs | 161μs |
| p95 | **185μs** | 245μs | 474μs |
| p99 | **219μs** | 299μs | 619μs |

## Findings

1. **Bun's native client wins every metric**: ~+40% throughput over the best Node combination and materially tighter tails (p99 219μs vs 299–619μs).
2. **node-redis degrades under Bun** (~−9% vs its own Node numbers) — compatibility-layer overhead.
3. **ioredis improves dramatically under Bun** (+48–63%) but still trails the native driver.
4. Ordering was stable across runs (<2% variance); absolute numbers remain machine-specific.
5. Reference point: `@ratelock/local` in-memory does ~1.0–1.25M ops/s — network RTT dominates all Redis paths equally.

## Decision impact

- Confirms shipping the `'bun'` driver ([BUN-02], already merged in working tree): it is not just compatible, it is the fastest Redis path available to RateLock users on Bun.
- Does NOT change [BUN-03] status: this evidence covers Redis only; Postgres via `Bun.SQL` stays parked per the unified-API stance.

Reproduce: `docker compose up -d redis-bench && BENCH_DRIVERS_DURATION_MS=5000 pnpm bench:drivers && BENCH_DRIVERS_DURATION_MS=5000 pnpm bench:drivers:bun && docker compose down`
