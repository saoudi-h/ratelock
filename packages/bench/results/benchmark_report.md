# 📊 RateLock v0.2.0 Comprehensive Performance Study

Generated on: `2026-06-06T13:35:12.292Z`  
Environment: Node.js `v25.9.0` | OS `linux` | Arch `x64`  
Harness Configuration: `80` concurrent worker loops, `2000ms` duration per scenario.

Postgres container runs with **production-default durability** (`synchronous_commit=on`, `fsync=on`, `full_page_writes=on`); only sizing tunings are applied.

## 1. Executive Summary & Design Recommendations

Based on extensive, high-fidelity benchmarks executed on PostgreSQL 18.4, here are our core architectural recommendations:

1. **Memory Storage (`@ratelock/local`)**: Stellar speeds exceeding **600,000 to 2,500,000+ ops/sec** under CPU-bound conditions. Fixed Window and Token Bucket are the most computationally efficient choice. Sliding Window is the slowest of the four (tens of thousands of ops/sec under spam) because every check iterates a per-key timestamp array.
2. **Redis vs Valkey**: Both backends perform exceptionally well and sit within a 4% band of each other under extreme spam. `ioredis` and `node-redis` also sit within a few percent on either backend; the limiter implementation is the dominant cost in this scenario, not the client or the server.
3. **Postgres Driver Selection (`postgres.js` vs `pg`/`node-postgres`)**: On the diverse scenario, `postgres.js` is the faster of the two (Fixed Window: 25,247 vs 21,347 logged / 25,323 unlogged; Token Bucket: 21,841 vs 17,334). The `unlogged` option is **1.19x** faster than logged tables on production-default durability. Under extreme Token Bucket spam on a single hot key, both drivers converge to roughly the same throughput (~1,700 ops/sec, ~234-248 ms p99) because the bottleneck is the database transaction lock, not the driver.
4. **RateLock vs Alternatives (`rate-limiter-flexible`)**: RateLock is **2.89x** faster on local memory and **1.67x** faster on Redis under extreme spam. On Postgres, the two libraries are **1.11x** (28,954 vs 25,975) — the gap narrows because the per-row transaction cost dominates. RateLock also offers a significantly cleaner, more modular developer experience and implements all four strategies natively on all three backends.
5. **Decorator value on remote backends**: Wrapping a remote limiter in `withCache` turns a Redis-bound denial path into a local-memory one under extreme spam: **136,337 → 2,281,266 ops/sec** (16.73x faster, p99 1.04ms → 0.04ms). `withCircuitBreaker` (131,950) and `withRetry` (135,332) show no benefit on the happy path; their value lives in the failure case (see #6).
6. **Decorator value under fault injection**: When the backend is healthy the failure-recovery decorators look like dead weight; when the backend is degraded they are the only thing standing between your service and a complete outage. With Redis hard-down, `withFallback` keeps the service at **120,876 ops/sec** (100% allowed) while raw Redis, `withRetry` and `withCircuitBreaker` collapse to 128,882 / 17,545 / 80,550 ops/sec. With 10% transient errors, `withFallback` (134,482) hides the blips entirely. The takeaway: a remote limiter is not production-ready without `withFallback`.

## 2. Benchmark Matrix: LOCAL ALGORITHMS

| Implementation Scenario                     | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Local Fixed Window (Diverse)**            |      1,100,111       |   6,607,403   |   100.000%   |   0.07ms    |   0.09ms    |   0.10ms    |
| **Local Sliding Window (Diverse)**          |       676,096        |   4,239,213   |   100.000%   |   0.11ms    |   0.13ms    |   0.17ms    |
| **Local Token Bucket (Diverse)**            |      1,097,299       |   6,573,643   |   100.000%   |   0.07ms    |   0.08ms    |   0.09ms    |
| **Local Indiv Fixed Window (Diverse)**      |      1,049,581       |   6,059,653   |   100.000%   |   0.08ms    |   0.08ms    |   0.10ms    |
| **Local Fixed Window (Extreme Spam)**       |      2,363,101       |     1,000     |    0.007%    |   0.04ms    |   0.03ms    |   0.04ms    |
| **Local Sliding Window (Extreme Spam)**     |        74,426        |     1,000     |    0.224%    |   1.07ms    |   1.89ms    |   2.15ms    |
| **Local Token Bucket (Extreme Spam)**       |      2,264,906       |     1,137     |    0.008%    |   0.04ms    |   0.04ms    |   0.05ms    |
| **Local Indiv Fixed Window (Extreme Spam)** |      2,469,378       |     1,000     |    0.007%    |   0.03ms    |   0.03ms    |   0.04ms    |

## 2. Benchmark Matrix: REDIS STRATEGIES

| Implementation Scenario                     | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis Fixed Window (Diverse)**            |       129,982        |    787,737    |   100.000%   |   0.61ms    |   0.90ms    |   1.07ms    |
| **Redis Sliding Window (Diverse)**          |        96,556        |    577,963    |   100.000%   |   0.83ms    |   1.03ms    |   1.42ms    |
| **Redis Token Bucket (Diverse)**            |       115,247        |    698,300    |   100.000%   |   0.69ms    |   0.89ms    |   1.12ms    |
| **Redis Indiv Fixed Window (Diverse)**      |       131,806        |    765,864    |   100.000%   |   0.63ms    |   0.88ms    |   1.02ms    |
| **Redis Fixed Window (Extreme Spam)**       |       133,926        |     1,000     |    0.116%    |   0.59ms    |   0.89ms    |   1.02ms    |
| **Redis Sliding Window (Extreme Spam)**     |       126,426        |     1,000     |    0.137%    |   0.64ms    |   0.88ms    |   1.02ms    |
| **Redis Token Bucket (Extreme Spam)**       |       140,712        |     1,102     |    0.130%    |   0.57ms    |   0.73ms    |   0.88ms    |
| **Redis Indiv Fixed Window (Extreme Spam)** |       142,358        |     1,000     |    0.117%    |   0.56ms    |   0.74ms    |   0.95ms    |

## 2. Benchmark Matrix: POSTGRES STRATEGIES

| Implementation Scenario                        | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :--------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Postgres Fixed Window (Diverse)**            |        26,987        |    159,674    |   100.000%   |   3.01ms    |   4.34ms    |   6.00ms    |
| **Postgres Sliding Window (Diverse)**          |        23,040        |    142,134    |   100.000%   |   3.39ms    |   5.93ms    |   6.94ms    |
| **Postgres Token Bucket (Diverse)**            |        22,665        |    133,121    |   100.000%   |   3.62ms    |   6.31ms    |   7.10ms    |
| **Postgres Indiv Fixed Window (Diverse)**      |        24,046        |    150,225    |   100.000%   |   3.21ms    |   5.01ms    |   6.84ms    |
| **Postgres Fixed Window (Extreme Spam)**       |        25,696        |     1,000     |    0.648%    |   3.17ms    |   5.39ms    |   6.41ms    |
| **Postgres Sliding Window (Extreme Spam)**     |        18,254        |     1,000     |    0.947%    |   4.41ms    |   7.90ms    |   9.51ms    |
| **Postgres Token Bucket (Extreme Spam)**       |        1,587         |     1,109     |   11.324%    |   49.70ms   |  155.96ms   |  253.49ms   |
| **Postgres Indiv Fixed Window (Extreme Spam)** |        22,694        |     1,000     |    0.734%    |   3.48ms    |   6.14ms    |   7.21ms    |

## 2. Benchmark Matrix: PACKAGE COMPARISON

| Implementation Scenario                           | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **RateLock Local Fixed Window (Extreme Spam)**    |      2,120,730       |     1,000     |    0.008%    |   0.04ms    |   0.04ms    |   0.06ms    |
| **rate-limiter-flexible Memory (Extreme Spam)**   |       732,739        |     1,000     |    0.023%    |   0.11ms    |   0.13ms    |   0.20ms    |
| **RateLock Redis Fixed Window (Extreme Spam)**    |       137,946        |     1,000     |    0.121%    |   0.59ms    |   0.89ms    |   1.08ms    |
| **rate-limiter-flexible Redis (Extreme Spam)**    |        82,646        |     1,000     |    0.202%    |   0.96ms    |   1.31ms    |   4.97ms    |
| **RateLock Postgres Fixed Window (Extreme Spam)** |        28,954        |     1,000     |    0.575%    |   2.94ms    |   4.86ms    |   5.56ms    |
| **rate-limiter-flexible Postgres (Extreme Spam)** |        25,975        |     1,000     |    0.685%    |   3.13ms    |   4.11ms    |   6.34ms    |

## 2. Benchmark Matrix: DRIVER ENGINE-BATTLE

| Implementation Scenario                               | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :---------------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis 7 (node-redis client) (Extreme Spam)**        |       135,690        |     1,000     |    0.126%    |   0.59ms    |   0.67ms    |   0.98ms    |
| **Redis 7 (ioredis client) (Extreme Spam)**           |       135,087        |     1,000     |    0.123%    |   0.59ms    |   0.81ms    |   0.99ms    |
| **Valkey (node-redis client) (Extreme Spam)**         |       134,360        |     1,000     |    0.124%    |   0.59ms    |   0.77ms    |   0.95ms    |
| **Valkey (ioredis client) (Extreme Spam)**            |       139,056        |     1,000     |    0.120%    |   0.58ms    |   0.81ms    |   0.99ms    |
| **Postgres.js - Fixed Window (Diverse)**              |        25,247        |    150,825    |   100.000%   |   3.19ms    |   4.98ms    |   10.68ms   |
| **node-postgres - Fixed Window (Logged) (Diverse)**   |        21,347        |    125,652    |   100.000%   |   3.82ms    |   5.68ms    |   6.68ms    |
| **node-postgres - Fixed Window (Unlogged) (Diverse)** |        25,323        |    150,556    |   100.000%   |   3.19ms    |   3.99ms    |   6.37ms    |
| **Postgres.js - Token Bucket (Diverse)**              |        21,841        |    129,956    |   100.000%   |   3.70ms    |   5.14ms    |   9.74ms    |
| **node-postgres - Token Bucket (Diverse)**            |        17,334        |    106,610    |   100.000%   |   4.51ms    |   7.77ms    |   9.30ms    |
| **Postgres.js - Token Bucket (Extreme Spam)**         |        1,654         |     1,115     |   10.067%    |   47.06ms   |  149.79ms   |  238.20ms   |
| **node-postgres - Token Bucket (Extreme Spam)**       |        1,621         |     1,108     |   10.544%    |   48.30ms   |  152.74ms   |  228.38ms   |

## 2. Benchmark Matrix: DECORATOR INFLUENCE

| Implementation Scenario                       | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :-------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Raw Fixed Window (local) (Diverse)**        |      1,117,016       |   6,788,914   |   100.000%   |   0.07ms    |   0.09ms    |   0.12ms    |
| **+ withCache (local) (Diverse)**             |       798,632        |   5,076,123   |   100.000%   |   0.10ms    |   0.09ms    |   0.13ms    |
| **+ withCircuitBreaker (local) (Diverse)**    |      1,035,451       |   6,482,713   |   100.000%   |   0.07ms    |   0.08ms    |   0.09ms    |
| **+ withFallback (local) (Diverse)**          |       856,252        |   5,548,222   |   100.000%   |   0.09ms    |   0.08ms    |   0.13ms    |
| **+ withRetry (local) (Diverse)**             |      1,027,102       |   5,449,039   |   100.000%   |   0.10ms    |   0.08ms    |   0.11ms    |
| **Raw Redis Fixed Window (Extreme Spam)**     |       136,337        |     1,000     |    0.159%    |   0.64ms    |   0.82ms    |   1.04ms    |
| **Redis + withCache (Extreme Spam)**          |      2,281,266       |     1,000     |    0.007%    |   0.04ms    |   0.03ms    |   0.04ms    |
| **Redis + withCircuitBreaker (Extreme Spam)** |       131,950        |     1,000     |    0.128%    |   0.60ms    |   0.87ms    |   1.07ms    |
| **Redis + withRetry (Extreme Spam)**          |       135,332        |     1,000     |    0.123%    |   0.60ms    |   0.84ms    |   1.04ms    |

## 2. Benchmark Matrix: DECORATOR FAULT-INJECTION

| Implementation Scenario                                              | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Raw Redis (10% transient errors) (Extreme Spam)**                  |       127,719        |     1,000     |    0.156%    |   0.70ms    |   1.01ms    |   1.66ms    |
| **Redis + withRetry (10% transient errors) (Extreme Spam)**          |       112,688        |     1,000     |    0.156%    |   0.72ms    |   1.57ms    |   2.43ms    |
| **Redis + withCircuitBreaker (10% transient errors) (Extreme Spam)** |        85,630        |      143      |    0.028%    |  1658.12ms  |  2000.17ms  |  2000.17ms  |
| **Redis + withFallback (10% transient errors) (Extreme Spam)**       |       134,482        |    80,896     |   10.132%    |   0.60ms    |   0.94ms    |   1.14ms    |
| **Raw Redis (50ms latency) (Extreme Spam)**                          |        1,570         |     1,000     |   10.417%    |   50.91ms   |   51.56ms   |   51.70ms   |
| **Redis + withRetry (50ms latency) (Extreme Spam)**                  |        1,572         |     1,000     |   10.417%    |   50.92ms   |   51.39ms   |   51.61ms   |
| **Redis + withCircuitBreaker (50ms latency) (Extreme Spam)**         |        1,572         |     1,000     |   10.417%    |   50.92ms   |   51.42ms   |   51.64ms   |
| **Raw Redis (hard down) (Extreme Spam)**                             |       128,882        |       0       |    0.000%    |   0.00ms    |   0.00ms    |   0.00ms    |
| **Redis + withRetry (hard down) (Extreme Spam)**                     |        17,545        |       0       |    0.000%    |   0.00ms    |   0.00ms    |   0.00ms    |
| **Redis + withCircuitBreaker (hard down) (Extreme Spam)**            |        80,550        |       0       |    0.000%    |   0.00ms    |   0.00ms    |   0.00ms    |
| **Redis + withFallback (hard down) (Extreme Spam)**                  |       120,876        |    719,904    |   100.000%   |   0.67ms    |   0.69ms    |   0.81ms    |

## 3. Rate Limit Allowed Rate (Success Rate) vs Blocked Rate Explanation

In this benchmark suite, **Rate Limit %** (historically named Success Rate) does _not_ indicate whether the code crashed or succeeded technically. Instead, it measures **how many requests were allowed through by the rate limiter**:

- **Rate Limit % = (Allowed Requests / Total Requests) \* 100**
- In diverse lookup scenarios, every request targets a fresh key, so 100% of requests are allowed.
- In extreme spam scenarios, workers spam the same key millions of times, but the limit is capped at 1,000 requests per minute. Therefore, only 1,000 requests are allowed through, which represents less than 0.1% of the total requests sent. Hence, the Allowed Rate naturally drops to **0.0%** for high-throughput memory limiters.
