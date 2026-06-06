# 📊 RateLock v0.2.0 Comprehensive Performance Study

Generated on: `2026-06-06T10:23:34.583Z`  
Environment: Node.js `v25.9.0` | OS `linux` | Arch `x64`  
Harness Configuration: `80` concurrent worker loops, `2000ms` duration per scenario.

Postgres container runs with **production-default durability** (`synchronous_commit=on`, `fsync=on`, `full_page_writes=on`); only sizing tunings are applied.

## 1. Executive Summary & Design Recommendations

Based on extensive, high-fidelity benchmarks executed on PostgreSQL 18.4, here are our core architectural recommendations:

1. **Memory Storage (`@ratelock/local`)**: Stellar speeds exceeding **600,000 to 2,500,000+ ops/sec** under CPU-bound conditions. Fixed Window and Token Bucket are the most computationally efficient choice. Sliding Window is the slowest of the four (tens of thousands of ops/sec under spam) because every check iterates a per-key timestamp array.
2. **Redis vs Valkey**: Both backends perform exceptionally well and sit within a 4% band of each other under extreme spam. `ioredis` and `node-redis` also sit within a few percent on either backend; the limiter implementation is the dominant cost in this scenario, not the client or the server.
3. **Postgres Driver Selection (`postgres.js` vs `pg`/`node-postgres`)**: On the diverse scenario, `postgres.js` is the faster of the two (Fixed Window: 33,025 vs 22,872 logged / 28,183 unlogged; Token Bucket: 23,853 vs 19,135). The `unlogged` option is **1.23x** faster than logged tables on production-default durability. Under extreme Token Bucket spam on a single hot key, both drivers converge to roughly the same throughput (~1,700 ops/sec, ~234-248 ms p99) because the bottleneck is the database transaction lock, not the driver.
4. **RateLock vs Alternatives (`rate-limiter-flexible`)**: RateLock is **2.80x** faster on local memory and **1.59x** faster on Redis under extreme spam. On Postgres, the two libraries are **1.00x** (28,226 vs 28,090) — the gap narrows because the per-row transaction cost dominates. RateLock also offers a significantly cleaner, more modular developer experience and implements all four strategies natively on all three backends.
5. **Decorator value on remote backends**: Wrapping a remote limiter in `withCache` turns a Redis-bound denial path into a local-memory one under extreme spam: **141,696 → 2,253,879 ops/sec** (15.91x faster, p99 0.94ms → 0.04ms). `withCircuitBreaker` (138,297) and `withRetry` (141,148) show no benefit on the happy path; their value lives in the failure case, which is not part of this matrix.

## 2. Benchmark Matrix: LOCAL ALGORITHMS

| Implementation Scenario                     | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Local Fixed Window (Diverse)**            |      1,116,628       |   6,847,330   |   100.000%   |   0.07ms    |   0.08ms    |   0.11ms    |
| **Local Sliding Window (Diverse)**          |       659,364        |   4,468,131   |   100.000%   |   0.11ms    |   0.11ms    |   0.17ms    |
| **Local Token Bucket (Diverse)**            |      1,110,771       |   6,805,901   |   100.000%   |   0.07ms    |   0.07ms    |   0.09ms    |
| **Local Indiv Fixed Window (Diverse)**      |       894,193        |   5,422,026   |   100.000%   |   0.09ms    |   0.07ms    |   0.10ms    |
| **Local Fixed Window (Extreme Spam)**       |      1,721,288       |     1,000     |    0.010%    |   0.04ms    |   0.03ms    |   0.05ms    |
| **Local Sliding Window (Extreme Spam)**     |        75,357        |     1,000     |    0.225%    |   1.07ms    |   1.63ms    |   1.95ms    |
| **Local Token Bucket (Extreme Spam)**       |      2,265,278       |     1,136     |    0.008%    |   0.04ms    |   0.04ms    |   0.04ms    |
| **Local Indiv Fixed Window (Extreme Spam)** |      2,395,288       |     1,000     |    0.007%    |   0.03ms    |   0.04ms    |   0.05ms    |

## 2. Benchmark Matrix: REDIS STRATEGIES

| Implementation Scenario                     | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis Fixed Window (Diverse)**            |       139,589        |    797,150    |   100.000%   |   0.61ms    |   0.79ms    |   1.04ms    |
| **Redis Sliding Window (Diverse)**          |        93,623        |    560,610    |   100.000%   |   0.86ms    |   1.06ms    |   1.48ms    |
| **Redis Token Bucket (Diverse)**            |       119,846        |    717,953    |   100.000%   |   0.67ms    |   0.89ms    |   1.17ms    |
| **Redis Indiv Fixed Window (Diverse)**      |       126,787        |    704,008    |   100.000%   |   0.70ms    |   0.88ms    |   1.19ms    |
| **Redis Fixed Window (Extreme Spam)**       |       144,617        |     1,000     |    0.115%    |   0.55ms    |   0.79ms    |   0.94ms    |
| **Redis Sliding Window (Extreme Spam)**     |       128,015        |     1,000     |    0.129%    |   0.62ms    |   0.86ms    |   1.02ms    |
| **Redis Token Bucket (Extreme Spam)**       |       141,574        |     1,102     |    0.130%    |   0.56ms    |   0.79ms    |   0.93ms    |
| **Redis Indiv Fixed Window (Extreme Spam)** |       138,985        |     1,000     |    0.120%    |   0.59ms    |   0.87ms    |   0.96ms    |

## 2. Benchmark Matrix: POSTGRES STRATEGIES

| Implementation Scenario                        | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :--------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Postgres Fixed Window (Diverse)**            |        29,494        |    177,764    |   100.000%   |   2.70ms    |   3.42ms    |   5.47ms    |
| **Postgres Sliding Window (Diverse)**          |        22,447        |    137,227    |   100.000%   |   3.50ms    |   5.91ms    |   7.40ms    |
| **Postgres Token Bucket (Diverse)**            |        20,943        |    127,316    |   100.000%   |   3.77ms    |   6.83ms    |   7.76ms    |
| **Postgres Indiv Fixed Window (Diverse)**      |        27,254        |    162,867    |   100.000%   |   2.95ms    |   4.53ms    |   6.03ms    |
| **Postgres Fixed Window (Extreme Spam)**       |        29,200        |     2,001     |    1.163%    |   2.76ms    |   4.81ms    |   5.54ms    |
| **Postgres Sliding Window (Extreme Spam)**     |        18,161        |     1,000     |    0.899%    |   4.40ms    |   8.02ms    |   9.71ms    |
| **Postgres Token Bucket (Extreme Spam)**       |        1,726         |     1,108     |   10.272%    |   45.62ms   |  139.77ms   |  220.05ms   |
| **Postgres Indiv Fixed Window (Extreme Spam)** |        23,345        |     1,000     |    0.722%    |   3.39ms    |   6.16ms    |   6.86ms    |

## 2. Benchmark Matrix: PACKAGE COMPARISON

| Implementation Scenario                           | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **RateLock Local Fixed Window (Extreme Spam)**    |      2,085,547       |     1,000     |    0.008%    |   0.04ms    |   0.04ms    |   0.05ms    |
| **rate-limiter-flexible Memory (Extreme Spam)**   |       745,874        |     1,000     |    0.022%    |   0.11ms    |   0.11ms    |   0.18ms    |
| **RateLock Redis Fixed Window (Extreme Spam)**    |       141,068        |     1,000     |    0.118%    |   0.57ms    |   0.74ms    |   1.00ms    |
| **rate-limiter-flexible Redis (Extreme Spam)**    |        88,461        |     1,000     |    0.187%    |   0.92ms    |   1.11ms    |   4.80ms    |
| **RateLock Postgres Fixed Window (Extreme Spam)** |        28,226        |     2,001     |    1.172%    |   2.87ms    |   4.82ms    |   5.81ms    |
| **rate-limiter-flexible Postgres (Extreme Spam)** |        28,090        |     1,000     |    0.612%    |   2.85ms    |   3.85ms    |   5.57ms    |

## 2. Benchmark Matrix: DRIVER ENGINE-BATTLE

| Implementation Scenario                               | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :---------------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis 7 (node-redis client) (Extreme Spam)**        |       140,096        |     1,000     |    0.120%    |   0.57ms    |   0.65ms    |   1.00ms    |
| **Redis 7 (ioredis client) (Extreme Spam)**           |       139,236        |     1,000     |    0.118%    |   0.58ms    |   0.72ms    |   1.08ms    |
| **Valkey (node-redis client) (Extreme Spam)**         |       134,653        |     1,000     |    0.118%    |   0.59ms    |   0.75ms    |   1.05ms    |
| **Valkey (ioredis client) (Extreme Spam)**            |       138,677        |     1,000     |    0.120%    |   0.58ms    |   0.74ms    |   1.05ms    |
| **Postgres.js - Fixed Window (Diverse)**              |        33,025        |    195,973    |   100.000%   |   2.45ms    |   3.59ms    |   8.80ms    |
| **node-postgres - Fixed Window (Logged) (Diverse)**   |        22,872        |    136,765    |   100.000%   |   3.51ms    |   5.10ms    |   5.67ms    |
| **node-postgres - Fixed Window (Unlogged) (Diverse)** |        28,183        |    168,501    |   100.000%   |   2.85ms    |   3.39ms    |   5.59ms    |
| **Postgres.js - Token Bucket (Diverse)**              |        23,853        |    143,931    |   100.000%   |   3.34ms    |   4.24ms    |   8.84ms    |
| **node-postgres - Token Bucket (Diverse)**            |        19,135        |    111,494    |   100.000%   |   4.31ms    |   7.16ms    |   8.80ms    |
| **Postgres.js - Token Bucket (Extreme Spam)**         |        1,725         |     1,109     |   10.359%    |   46.21ms   |  142.41ms   |  212.94ms   |
| **node-postgres - Token Bucket (Extreme Spam)**       |        1,757         |     1,104     |   10.168%    |   46.41ms   |  139.83ms   |  222.83ms   |

## 2. Benchmark Matrix: DECORATOR INFLUENCE

| Implementation Scenario                       | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :-------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Raw Fixed Window (local) (Diverse)**        |      1,148,222       |   7,136,715   |   100.000%   |   0.07ms    |   0.08ms    |   0.09ms    |
| **+ withCache (local) (Diverse)**             |      1,025,081       |   5,880,761   |   100.000%   |   0.08ms    |   0.08ms    |   0.10ms    |
| **+ withCircuitBreaker (local) (Diverse)**    |      1,030,510       |   6,180,895   |   100.000%   |   0.08ms    |   0.08ms    |   0.09ms    |
| **+ withFallback (local) (Diverse)**          |       986,972        |   5,796,775   |   100.000%   |   0.09ms    |   0.07ms    |   0.10ms    |
| **+ withRetry (local) (Diverse)**             |       486,653        |   3,492,466   |   100.000%   |   0.19ms    |   0.27ms    |   0.29ms    |
| **Raw Redis Fixed Window (Extreme Spam)**     |       141,696        |     1,000     |    0.118%    |   0.56ms    |   0.67ms    |   0.94ms    |
| **Redis + withCache (Extreme Spam)**          |      2,253,879       |     1,000     |    0.012%    |   0.04ms    |   0.03ms    |   0.04ms    |
| **Redis + withCircuitBreaker (Extreme Spam)** |       138,297        |     1,000     |    0.141%    |   0.61ms    |   0.65ms    |   1.09ms    |
| **Redis + withRetry (Extreme Spam)**          |       141,148        |     1,000     |    0.116%    |   0.57ms    |   0.65ms    |   0.94ms    |

## 3. Rate Limit Allowed Rate (Success Rate) vs Blocked Rate Explanation

In this benchmark suite, **Rate Limit %** (historically named Success Rate) does _not_ indicate whether the code crashed or succeeded technically. Instead, it measures **how many requests were allowed through by the rate limiter**:

- **Rate Limit % = (Allowed Requests / Total Requests) \* 100**
- In diverse lookup scenarios, every request targets a fresh key, so 100% of requests are allowed.
- In extreme spam scenarios, workers spam the same key millions of times, but the limit is capped at 1,000 requests per minute. Therefore, only 1,000 requests are allowed through, which represents less than 0.1% of the total requests sent. Hence, the Allowed Rate naturally drops to **0.0%** for high-throughput memory limiters.
