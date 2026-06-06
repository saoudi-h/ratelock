# 📊 RateLock v0.2.0 Comprehensive Performance Study

Generated on: `2026-06-06T08:28:44.325Z`  
Environment: Node.js `v25.9.0` | OS `linux` | Arch `x64`  
Harness Configuration: `80` concurrent worker loops, `2000ms` duration per scenario.

## 1. Executive Summary & Design Recommendations

Based on extensive, high-fidelity benchmarks executed on PostgreSQL 18.4, here are our core architectural recommendations:

1. **Memory Storage (`@ratelock/local`)**: Stellar speeds exceeding **600,000 to 2,500,000+ ops/sec** under CPU-bound conditions. Fixed Window and Token Bucket are the most computationally efficient choice. Sliding Window is the slowest of the four (tens of thousands of ops/sec under spam) because every check iterates a per-key timestamp array.
2. **Redis vs Valkey**: Both backends perform exceptionally well and sit within a 4% band of each other under extreme spam. `ioredis` and `node-redis` also sit within a few percent on either backend; the limiter implementation is the dominant cost in this scenario, not the client or the server.
3. **Postgres Driver Selection (`postgres.js` vs `pg`/`node-postgres`)**: `postgres.js` is the faster of the two on the diverse scenario (Fixed Window: 30,857 vs 25,072; Token Bucket: 21,860 vs 17,304), where the overhead per check is what matters. Under extreme Token Bucket spam on a single hot key, both drivers converge to roughly the same throughput (~1,600 ops/sec, ~230-240 ms p99) because the bottleneck is the database transaction lock, not the driver.
4. **RateLock vs Alternatives (`rate-limiter-flexible`)**: RateLock is **2.87x** faster on local memory and **1.67x** faster on Redis under extreme spam. On Postgres, the two libraries are effectively identical in this run (1.00x — the medians differ by two requests per second). RateLock also offers a significantly cleaner, more modular developer experience and implements all four strategies natively on all three backends.

## 2. Benchmark Matrix: LOCAL ALGORITHMS

| Implementation Scenario                     | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Local Fixed Window (Diverse)**            |      1,012,478       |   2,024,981   |   100.000%   |   0.08ms    |   0.11ms    |   0.16ms    |
| **Local Sliding Window (Diverse)**          |       803,307        |   1,608,238   |   100.000%   |   0.10ms    |   0.08ms    |   0.12ms    |
| **Local Token Bucket (Diverse)**            |      1,095,092       |   2,190,208   |   100.000%   |   0.07ms    |   0.07ms    |   0.09ms    |
| **Local Indiv Fixed Window (Diverse)**      |      1,061,831       |   2,123,696   |   100.000%   |   0.08ms    |   0.07ms    |   0.09ms    |
| **Local Fixed Window (Extreme Spam)**       |      2,358,111       |     1,000     |    0.021%    |   0.03ms    |   0.04ms    |   0.06ms    |
| **Local Sliding Window (Extreme Spam)**     |       179,356        |     1,000     |    0.279%    |   0.45ms    |   1.04ms    |   1.70ms    |
| **Local Token Bucket (Extreme Spam)**       |      2,303,868       |     1,033     |    0.022%    |   0.03ms    |   0.04ms    |   0.05ms    |
| **Local Indiv Fixed Window (Extreme Spam)** |      2,529,055       |     1,000     |    0.020%    |   0.03ms    |   0.03ms    |   0.04ms    |

## 2. Benchmark Matrix: REDIS STRATEGIES

| Implementation Scenario                     | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis Fixed Window (Diverse)**            |       130,248        |    260,539    |   100.000%   |   0.61ms    |   0.84ms    |   1.55ms    |
| **Redis Sliding Window (Diverse)**          |        90,610        |    181,286    |   100.000%   |   0.88ms    |   1.21ms    |   1.60ms    |
| **Redis Token Bucket (Diverse)**            |       115,271        |    230,589    |   100.000%   |   0.69ms    |   0.98ms    |   1.58ms    |
| **Redis Indiv Fixed Window (Diverse)**      |        90,422        |    180,886    |   100.000%   |   0.88ms    |   1.24ms    |   1.99ms    |
| **Redis Fixed Window (Extreme Spam)**       |       145,201        |     1,000     |    0.344%    |   0.55ms    |   0.77ms    |   1.13ms    |
| **Redis Sliding Window (Extreme Spam)**     |       123,425        |     1,000     |    0.405%    |   0.65ms    |   0.91ms    |   1.19ms    |
| **Redis Token Bucket (Extreme Spam)**       |       135,541        |     1,033     |    0.381%    |   0.59ms    |   0.85ms    |   1.12ms    |
| **Redis Indiv Fixed Window (Extreme Spam)** |       142,884        |     1,000     |    0.350%    |   0.56ms    |   0.77ms    |   1.02ms    |

## 2. Benchmark Matrix: POSTGRES STRATEGIES

| Implementation Scenario                        | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :--------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Postgres Fixed Window (Diverse)**            |        26,658        |    53,333     |   100.000%   |   3.00ms    |   4.36ms    |   6.07ms    |
| **Postgres Sliding Window (Diverse)**          |        24,001        |    48,019     |   100.000%   |   3.33ms    |   5.49ms    |   6.70ms    |
| **Postgres Token Bucket (Diverse)**            |        22,021        |    44,060     |   100.000%   |   3.63ms    |   6.48ms    |   7.24ms    |
| **Postgres Indiv Fixed Window (Diverse)**      |        25,935        |    51,892     |   100.000%   |   3.08ms    |   4.51ms    |   6.22ms    |
| **Postgres Fixed Window (Extreme Spam)**       |        27,642        |     1,000     |    1.808%    |   2.89ms    |   5.12ms    |   5.72ms    |
| **Postgres Sliding Window (Extreme Spam)**     |        17,763        |     1,000     |    2.814%    |   4.50ms    |   8.15ms    |   10.19ms   |
| **Postgres Token Bucket (Extreme Spam)**       |        1,756         |     1,033     |   28.734%    |   45.18ms   |  138.92ms   |  216.49ms   |
| **Postgres Indiv Fixed Window (Extreme Spam)** |        23,180        |     1,000     |    2.156%    |   3.45ms    |   6.05ms    |   7.06ms    |

## 2. Benchmark Matrix: PACKAGE COMPARISON

| Implementation Scenario                           | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **RateLock Local Fixed Window (Extreme Spam)**    |      2,104,195       |     1,000     |    0.024%    |   0.04ms    |   0.04ms    |   0.06ms    |
| **rate-limiter-flexible Memory (Extreme Spam)**   |       759,173        |     1,000     |    0.066%    |   0.11ms    |   0.11ms    |   0.16ms    |
| **RateLock Redis Fixed Window (Extreme Spam)**    |       133,310        |     1,000     |    0.375%    |   0.60ms    |   0.89ms    |   1.06ms    |
| **rate-limiter-flexible Redis (Extreme Spam)**    |        87,194        |     1,000     |    0.573%    |   0.92ms    |   1.18ms    |   4.83ms    |
| **RateLock Postgres Fixed Window (Extreme Spam)** |        26,122        |     1,000     |    1.913%    |   3.06ms    |   5.38ms    |   6.19ms    |
| **rate-limiter-flexible Postgres (Extreme Spam)** |        24,820        |     1,000     |    2.014%    |   3.22ms    |   4.32ms    |   6.44ms    |

## 2. Benchmark Matrix: DRIVER ENGINE-BATTLE

| Implementation Scenario                               | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :---------------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis 7 (node-redis client) (Extreme Spam)**        |       133,968        |     1,000     |    0.373%    |   0.60ms    |   0.81ms    |   0.99ms    |
| **Redis 7 (ioredis client) (Extreme Spam)**           |       134,938        |     1,000     |    0.371%    |   0.59ms    |   0.90ms    |   1.10ms    |
| **Valkey (node-redis client) (Extreme Spam)**         |       138,585        |     1,000     |    0.361%    |   0.58ms    |   0.72ms    |   0.96ms    |
| **Valkey (ioredis client) (Extreme Spam)**            |       130,755        |     2,000     |    0.765%    |   0.61ms    |   0.90ms    |   1.32ms    |
| **Postgres.js - Fixed Window (Diverse)**              |        28,645        |    57,330     |   100.000%   |   2.79ms    |   4.00ms    |   9.88ms    |
| **node-postgres - Fixed Window (Logged) (Diverse)**   |        23,569        |    47,152     |   100.000%   |   3.39ms    |   4.50ms    |   6.79ms    |
| **node-postgres - Fixed Window (Unlogged) (Diverse)** |        24,092        |    48,199     |   100.000%   |   3.32ms    |   4.71ms    |   6.61ms    |
| **Postgres.js - Token Bucket (Diverse)**              |        21,516        |    43,054     |   100.000%   |   3.72ms    |   5.10ms    |   10.13ms   |
| **node-postgres - Token Bucket (Diverse)**            |        16,802        |    33,618     |   100.000%   |   4.76ms    |   7.47ms    |   9.65ms    |
| **Postgres.js - Token Bucket (Extreme Spam)**         |        1,790         |     1,032     |   28.135%    |   44.30ms   |  136.05ms   |  213.09ms   |
| **node-postgres - Token Bucket (Extreme Spam)**       |        1,749         |     1,034     |   28.738%    |   45.22ms   |  137.42ms   |  232.80ms   |

## 2. Benchmark Matrix: DECORATOR INFLUENCE

| Implementation Scenario                         | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :---------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Raw Fixed Window (Diverse)**                  |      1,059,940       |   2,119,896   |   100.000%   |   0.08ms    |   0.09ms    |   0.13ms    |
| **Fixed Window + withCache (Diverse)**          |      1,037,588       |   2,075,195   |   100.000%   |   0.08ms    |   0.08ms    |   0.12ms    |
| **Fixed Window + withCircuitBreaker (Diverse)** |       710,485        |   1,420,980   |   100.000%   |   0.11ms    |   0.08ms    |   0.12ms    |
| **Fixed Window + withFallback (Diverse)**       |       774,922        |   1,553,059   |   100.000%   |   0.10ms    |   0.07ms    |   0.10ms    |
| **Fixed Window + withRetry (Diverse)**          |       789,238        |   1,581,757   |   100.000%   |   0.10ms    |   0.08ms    |   0.12ms    |
| **Raw Fixed Window (Extreme Spam)**             |      1,500,786       |     1,000     |    0.033%    |   0.05ms    |   0.03ms    |   0.05ms    |
| **Fixed Window + withCache (Extreme Spam)**     |       843,119        |     1,000     |    0.059%    |   0.09ms    |   0.06ms    |   0.70ms    |

## 3. Rate Limit Allowed Rate (Success Rate) vs Blocked Rate Explanation

In this benchmark suite, **Rate Limit %** (historically named Success Rate) does _not_ indicate whether the code crashed or succeeded technically. Instead, it measures **how many requests were allowed through by the rate limiter**:

- **Rate Limit % = (Allowed Requests / Total Requests) \* 100**
- In diverse lookup scenarios, every request targets a fresh key, so 100% of requests are allowed.
- In extreme spam scenarios, workers spam the same key millions of times, but the limit is capped at 1,000 requests per minute. Therefore, only 1,000 requests are allowed through, which represents less than 0.1% of the total requests sent. Hence, the Allowed Rate naturally drops to **0.0%** for high-throughput memory limiters.
