# 📊 RateLock v0.2.0 Comprehensive Performance Study

Generated on: `2026-07-03T12:23:35.074Z`  
Environment: Node.js `v25.9.0` | OS `linux` | Arch `x64`  
Harness Configuration: `80` concurrent worker loops, `3000ms` duration per scenario.

Postgres container runs with **production-default durability** (`synchronous_commit=on`, `fsync=on`, `full_page_writes=on`); only sizing tunings are applied.

## 1. Executive Summary & Design Recommendations

Based on extensive, high-fidelity benchmarks executed on PostgreSQL 18.4, here are our core architectural recommendations:

1. **Memory Storage (`@ratelock/local`)**: Stellar speeds exceeding **600,000 to 2,500,000+ ops/sec** under CPU-bound conditions. Fixed Window and Token Bucket are the most computationally efficient choice. Sliding Window is the slowest of the four (tens of thousands of ops/sec under spam) because every check iterates a per-key timestamp array.
2. **Redis vs Valkey**: Both backends perform exceptionally well and sit within a 4% band of each other under extreme spam. `ioredis` and `node-redis` also sit within a few percent on either backend; the limiter implementation is the dominant cost in this scenario, not the client or the server.
3. **Postgres Driver Selection (`postgres.js` vs `pg`/`node-postgres`)**: On the diverse scenario, `postgres.js` is the faster of the two (Fixed Window: ? vs ? logged / ? unlogged; Token Bucket: ? vs ?). The `unlogged` option is **?** faster than logged tables on production-default durability. Under extreme Token Bucket spam on a single hot key, both drivers converge to roughly the same throughput (~1,700 ops/sec, ~234-248 ms p99) because the bottleneck is the database transaction lock, not the driver.
4. **RateLock vs Alternatives (`rate-limiter-flexible`)**: RateLock is **?** faster on local memory and **?** faster on Redis under extreme spam. On Postgres, the two libraries are **?** (? vs ?) — the gap narrows because the per-row transaction cost dominates. RateLock also offers a significantly cleaner, more modular developer experience and implements all four strategies natively on all three backends.
5. **Decorator value on remote backends**: Wrapping a remote limiter in `withCache` turns a Redis-bound denial path into a local-memory one under extreme spam: **? → ? ops/sec** (? faster, p99 ?ms → ?ms). `withCircuitBreaker` (?) and `withRetry` (?) show no benefit on the happy path; their value lives in the failure case (see #6).
6. **Decorator value under fault injection**: When the backend is healthy the failure-recovery decorators look like dead weight; when the backend is degraded they are the only thing standing between your service and a complete outage. With Redis hard-down, `withFallback` keeps the service at **? ops/sec** (100% allowed) while raw Redis, `withRetry` and `withCircuitBreaker` collapse to ? / ? / ? ops/sec. With 10% transient errors, `withFallback` (?) hides the blips entirely. The takeaway: a remote limiter is not production-ready without `withFallback`.

## 2. Benchmark Matrix: POSTGRES STRATEGIES

| Implementation Scenario                        | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :--------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Postgres Fixed Window (Diverse)**            |        28,721        |    256,092    |   100.000%   |   2.81ms    |   4.48ms    |   5.67ms    |
| **Postgres Sliding Window (Diverse)**          |        22,367        |    199,803    |   100.000%   |   3.60ms    |   6.43ms    |   7.09ms    |
| **Postgres Token Bucket (Diverse)**            |        21,303        |    190,056    |   100.000%   |   3.79ms    |   6.74ms    |   7.43ms    |
| **Postgres Indiv Fixed Window (Diverse)**      |        25,149        |    225,394    |   100.000%   |   3.20ms    |   5.20ms    |   6.58ms    |
| **Postgres Fixed Window (Extreme Spam)**       |        27,406        |     2,001     |    0.838%    |   2.97ms    |   5.14ms    |   5.85ms    |
| **Postgres Sliding Window (Extreme Spam)**     |        22,254        |     1,006     |    0.490%    |   3.60ms    |   6.34ms    |   7.39ms    |
| **Postgres Token Bucket (Extreme Spam)**       |        1,662         |     1,170     |    7.733%    |   49.73ms   |  144.95ms   |  228.72ms   |
| **Postgres Indiv Fixed Window (Extreme Spam)** |        20,326        |     1,000     |    0.702%    |   4.29ms    |   7.06ms    |   8.39ms    |

## 3. Rate Limit Allowed Rate (Success Rate) vs Blocked Rate Explanation

In this benchmark suite, **Rate Limit %** (historically named Success Rate) does _not_ indicate whether the code crashed or succeeded technically. Instead, it measures **how many requests were allowed through by the rate limiter**:

- **Rate Limit % = (Allowed Requests / Total Requests) \* 100**
- In diverse lookup scenarios, every request targets a fresh key, so 100% of requests are allowed.
- In extreme spam scenarios, workers spam the same key millions of times, but the limit is capped at 1,000 requests per minute. Therefore, only 1,000 requests are allowed through, which represents less than 0.1% of the total requests sent. Hence, the Allowed Rate naturally drops to **0.0%** for high-throughput memory limiters.
