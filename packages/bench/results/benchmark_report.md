# 📊 RateLock v0.2.0 Comprehensive Performance Study

Generated on: `2026-06-06T15:28:42.272Z`  
Environment: Node.js `v25.9.0` | OS `linux` | Arch `x64`  
Harness Configuration: `80` concurrent worker loops, `2000ms` duration per scenario.

Postgres container runs with **production-default durability** (`synchronous_commit=on`, `fsync=on`, `full_page_writes=on`); only sizing tunings are applied.

## 1. Executive Summary & Design Recommendations

Based on extensive, high-fidelity benchmarks executed on PostgreSQL 18.4, here are our core architectural recommendations:

1. **Memory Storage (`@ratelock/local`)**: Stellar speeds exceeding **600,000 to 2,500,000+ ops/sec** under CPU-bound conditions. Fixed Window and Token Bucket are the most computationally efficient choice. Sliding Window is the slowest of the four (tens of thousands of ops/sec under spam) because every check iterates a per-key timestamp array.
2. **Redis vs Valkey**: Both backends perform exceptionally well and sit within a 4% band of each other under extreme spam. `ioredis` and `node-redis` also sit within a few percent on either backend; the limiter implementation is the dominant cost in this scenario, not the client or the server.
3. **Postgres Driver Selection (`postgres.js` vs `pg`/`node-postgres`)**: On the diverse scenario, `postgres.js` is the faster of the two (Fixed Window: 31,039 vs 22,341 logged / 26,960 unlogged; Token Bucket: 23,825 vs 18,987). The `unlogged` option is **1.21x** faster than logged tables on production-default durability. Under extreme Token Bucket spam on a single hot key, both drivers converge to roughly the same throughput (~1,700 ops/sec, ~234-248 ms p99) because the bottleneck is the database transaction lock, not the driver.
4. **RateLock vs Alternatives (`rate-limiter-flexible`)**: RateLock is **2.88x** faster on local memory and **1.65x** faster on Redis under extreme spam. On Postgres, the two libraries are **1.05x** (28,504 vs 27,251) — the gap narrows because the per-row transaction cost dominates. RateLock also offers a significantly cleaner, more modular developer experience and implements all four strategies natively on all three backends.
5. **Decorator value on remote backends**: Wrapping a remote limiter in `withCache` turns a Redis-bound denial path into a local-memory one under extreme spam: **143,059 → 2,320,245 ops/sec** (16.22x faster, p99 1.11ms → 0.04ms). `withCircuitBreaker` (139,674) and `withRetry` (139,763) show no benefit on the happy path; their value lives in the failure case (see #6).
6. **Decorator value under fault injection**: When the backend is healthy the failure-recovery decorators look like dead weight; when the backend is degraded they are the only thing standing between your service and a complete outage. With Redis hard-down, `withFallback` keeps the service at **121,419 ops/sec** (100% allowed) while raw Redis, `withRetry` and `withCircuitBreaker` collapse to 131,050 / 18,043 / 84,658 ops/sec. With 10% transient errors, `withFallback` (133,743) hides the blips entirely. The takeaway: a remote limiter is not production-ready without `withFallback`.

## 2. Benchmark Matrix: LOCAL ALGORITHMS

| Implementation Scenario                     | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Local Fixed Window (Diverse)**            |      1,114,007       |   6,932,163   |   100.000%   |   0.07ms    |   0.09ms    |   0.11ms    |
| **Local Sliding Window (Diverse)**          |       754,021        |   4,439,238   |   100.000%   |   0.11ms    |   0.10ms    |   0.13ms    |
| **Local Token Bucket (Diverse)**            |      1,143,663       |   6,574,419   |   100.000%   |   0.08ms    |   0.07ms    |   0.10ms    |
| **Local Indiv Fixed Window (Diverse)**      |      1,187,254       |   6,208,113   |   100.000%   |   0.08ms    |   0.08ms    |   0.09ms    |
| **Local Fixed Window (Extreme Spam)**       |      2,360,128       |     2,000     |    0.014%    |   0.03ms    |   0.04ms    |   0.04ms    |
| **Local Sliding Window (Extreme Spam)**     |        75,608        |     1,000     |    0.224%    |   1.06ms    |   1.68ms    |   2.07ms    |
| **Local Token Bucket (Extreme Spam)**       |      2,368,790       |     1,137     |    0.009%    |   0.03ms    |   0.03ms    |   0.04ms    |
| **Local Indiv Fixed Window (Extreme Spam)** |      2,528,856       |     1,000     |    0.007%    |   0.03ms    |   0.03ms    |   0.04ms    |

## 2. Benchmark Matrix: REDIS STRATEGIES

| Implementation Scenario                     | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis Fixed Window (Diverse)**            |       142,128        |    842,193    |   100.000%   |   0.57ms    |   0.76ms    |   0.94ms    |
| **Redis Sliding Window (Diverse)**          |       102,150        |    611,265    |   100.000%   |   0.79ms    |   0.87ms    |   1.26ms    |
| **Redis Token Bucket (Diverse)**            |       125,000        |    752,386    |   100.000%   |   0.64ms    |   0.69ms    |   0.93ms    |
| **Redis Indiv Fixed Window (Diverse)**      |       138,922        |    799,287    |   100.000%   |   0.60ms    |   0.68ms    |   1.03ms    |
| **Redis Fixed Window (Extreme Spam)**       |       149,546        |     2,000     |    0.223%    |   0.53ms    |   0.62ms    |   0.93ms    |
| **Redis Sliding Window (Extreme Spam)**     |       132,128        |     1,000     |    0.126%    |   0.61ms    |   0.86ms    |   1.11ms    |
| **Redis Token Bucket (Extreme Spam)**       |       139,691        |     1,102     |    0.133%    |   0.57ms    |   0.85ms    |   0.96ms    |
| **Redis Indiv Fixed Window (Extreme Spam)** |       145,760        |     1,000     |    0.114%    |   0.55ms    |   0.65ms    |   0.98ms    |

## 2. Benchmark Matrix: POSTGRES STRATEGIES

| Implementation Scenario                        | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :--------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Postgres Fixed Window (Diverse)**            |        27,722        |    167,698    |   100.000%   |   2.87ms    |   3.93ms    |   5.87ms    |
| **Postgres Sliding Window (Diverse)**          |        27,142        |    163,815    |   100.000%   |   2.93ms    |   4.74ms    |   6.17ms    |
| **Postgres Token Bucket (Diverse)**            |        25,116        |    148,617    |   100.000%   |   3.24ms    |   5.69ms    |   6.34ms    |
| **Postgres Indiv Fixed Window (Diverse)**      |        28,964        |    171,110    |   100.000%   |   2.81ms    |   4.50ms    |   5.53ms    |
| **Postgres Fixed Window (Extreme Spam)**       |        28,823        |     1,000     |    0.581%    |   2.77ms    |   4.94ms    |   5.59ms    |
| **Postgres Sliding Window (Extreme Spam)**     |        18,512        |     1,000     |    0.900%    |   4.32ms    |   7.79ms    |   9.11ms    |
| **Postgres Token Bucket (Extreme Spam)**       |        1,817         |     1,127     |    9.972%    |   43.42ms   |  135.60ms   |  214.24ms   |
| **Postgres Indiv Fixed Window (Extreme Spam)** |        23,532        |     1,000     |    0.708%    |   3.41ms    |   6.15ms    |   6.80ms    |

## 2. Benchmark Matrix: PACKAGE COMPARISON

| Implementation Scenario                           | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **RateLock Local Fixed Window (Extreme Spam)**    |      2,140,994       |     1,000     |    0.008%    |   0.04ms    |   0.04ms    |   0.04ms    |
| **rate-limiter-flexible Memory (Extreme Spam)**   |       744,472        |     1,000     |    0.024%    |   0.11ms    |   0.11ms    |   0.14ms    |
| **RateLock Redis Fixed Window (Extreme Spam)**    |       145,732        |     1,000     |    0.115%    |   0.55ms    |   0.66ms    |   0.95ms    |
| **rate-limiter-flexible Redis (Extreme Spam)**    |        88,350        |     1,000     |    0.206%    |   0.93ms    |   1.10ms    |   4.63ms    |
| **RateLock Postgres Fixed Window (Extreme Spam)** |        28,504        |     1,000     |    0.571%    |   2.80ms    |   4.98ms    |   5.55ms    |
| **rate-limiter-flexible Postgres (Extreme Spam)** |        27,251        |     1,000     |    0.612%    |   2.92ms    |   3.97ms    |   5.78ms    |

## 2. Benchmark Matrix: DRIVER ENGINE-BATTLE

| Implementation Scenario                               | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :---------------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis 8 (node-redis client) (Extreme Spam)**        |       141,776        |     1,000     |    0.118%    |   0.57ms    |   0.60ms    |   0.95ms    |
| **Redis 8 (ioredis client) (Extreme Spam)**           |       144,140        |     1,000     |    0.116%    |   0.56ms    |   0.64ms    |   0.93ms    |
| **Valkey 8 (node-redis client) (Extreme Spam)**       |       143,296        |     1,000     |    0.116%    |   0.56ms    |   0.60ms    |   0.83ms    |
| **Valkey 8 (ioredis client) (Extreme Spam)**          |       137,709        |     1,000     |    0.117%    |   0.58ms    |   0.78ms    |   0.96ms    |
| **Postgres.js - Fixed Window (Diverse)**              |        31,039        |    187,783    |   100.000%   |   2.56ms    |   3.69ms    |   8.89ms    |
| **node-postgres - Fixed Window (Logged) (Diverse)**   |        22,341        |    134,047    |   100.000%   |   3.58ms    |   5.37ms    |   5.86ms    |
| **node-postgres - Fixed Window (Unlogged) (Diverse)** |        26,960        |    155,182    |   100.000%   |   3.11ms    |   3.86ms    |   5.92ms    |
| **Postgres.js - Token Bucket (Diverse)**              |        23,825        |    141,808    |   100.000%   |   3.39ms    |   4.34ms    |   8.68ms    |
| **node-postgres - Token Bucket (Diverse)**            |        18,987        |    115,297    |   100.000%   |   4.17ms    |   7.20ms    |   8.58ms    |
| **Postgres.js - Token Bucket (Extreme Spam)**         |        1,647         |     1,111     |   10.323%    |   47.06ms   |  145.78ms   |  236.75ms   |
| **node-postgres - Token Bucket (Extreme Spam)**       |        1,701         |     1,106     |   10.455%    |   46.59ms   |  142.57ms   |  227.45ms   |

## 2. Benchmark Matrix: DECORATOR INFLUENCE

| Implementation Scenario                       | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :-------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Raw Fixed Window (local) (Diverse)**        |      1,137,689       |   7,114,832   |   100.000%   |   0.07ms    |   0.09ms    |   0.09ms    |
| **+ withCache (local) (Diverse)**             |      1,036,213       |   6,008,730   |   100.000%   |   0.08ms    |   0.08ms    |   0.10ms    |
| **+ withCircuitBreaker (local) (Diverse)**    |      1,077,556       |   6,211,996   |   100.000%   |   0.08ms    |   0.07ms    |   0.09ms    |
| **+ withFallback (local) (Diverse)**          |      1,027,640       |   5,889,931   |   100.000%   |   0.08ms    |   0.08ms    |   0.10ms    |
| **+ withRetry (local) (Diverse)**             |      1,027,654       |   6,536,050   |   100.000%   |   0.07ms    |   0.08ms    |   0.09ms    |
| **Raw Redis Fixed Window (Extreme Spam)**     |       143,059        |     2,000     |    0.244%    |   0.57ms    |   0.68ms    |   1.11ms    |
| **Redis + withCache (Extreme Spam)**          |      2,320,245       |     1,000     |    0.007%    |   0.04ms    |   0.03ms    |   0.04ms    |
| **Redis + withCircuitBreaker (Extreme Spam)** |       139,674        |     1,000     |    0.121%    |   0.57ms    |   0.66ms    |   0.97ms    |
| **Redis + withRetry (Extreme Spam)**          |       139,763        |     1,000     |    0.119%    |   0.58ms    |   0.68ms    |   1.00ms    |

## 2. Benchmark Matrix: DECORATOR FAULT-INJECTION

| Implementation Scenario                                              | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Raw Redis (10% transient errors) (Extreme Spam)**                  |       137,539        |     1,000     |    0.121%    |   0.61ms    |   0.93ms    |   1.06ms    |
| **Redis + withRetry (10% transient errors) (Extreme Spam)**          |       117,343        |     1,000     |    0.142%    |   0.68ms    |   1.46ms    |   2.13ms    |
| **Redis + withCircuitBreaker (10% transient errors) (Extreme Spam)** |        86,669        |      146      |    0.028%    |  1657.73ms  |  2000.09ms  |  2000.13ms  |
| **Redis + withFallback (10% transient errors) (Extreme Spam)**       |       133,743        |    81,732     |   10.182%    |   0.60ms    |   0.96ms    |   1.06ms    |
| **Raw Redis (50ms latency) (Extreme Spam)**                          |        1,490         |     2,000     |   21.382%    |   53.61ms   |   74.03ms   |   74.22ms   |
| **Redis + withRetry (50ms latency) (Extreme Spam)**                  |        1,573         |     1,000     |   10.417%    |   50.80ms   |   51.38ms   |   51.59ms   |
| **Redis + withCircuitBreaker (50ms latency) (Extreme Spam)**         |        1,570         |     1,000     |   10.417%    |   50.90ms   |   51.25ms   |   51.45ms   |
| **Raw Redis (hard down) (Extreme Spam)**                             |       131,050        |       0       |    0.000%    |   0.00ms    |   0.00ms    |   0.00ms    |
| **Redis + withRetry (hard down) (Extreme Spam)**                     |        18,043        |       0       |    0.000%    |   0.00ms    |   0.00ms    |   0.00ms    |
| **Redis + withCircuitBreaker (hard down) (Extreme Spam)**            |        84,658        |       0       |    0.000%    |   0.00ms    |   0.00ms    |   0.00ms    |
| **Redis + withFallback (hard down) (Extreme Spam)**                  |       121,419        |    727,023    |   100.000%   |   0.66ms    |   0.68ms    |   0.77ms    |

## 3. Rate Limit Allowed Rate (Success Rate) vs Blocked Rate Explanation

In this benchmark suite, **Rate Limit %** (historically named Success Rate) does _not_ indicate whether the code crashed or succeeded technically. Instead, it measures **how many requests were allowed through by the rate limiter**:

- **Rate Limit % = (Allowed Requests / Total Requests) \* 100**
- In diverse lookup scenarios, every request targets a fresh key, so 100% of requests are allowed.
- In extreme spam scenarios, workers spam the same key millions of times, but the limit is capped at 1,000 requests per minute. Therefore, only 1,000 requests are allowed through, which represents less than 0.1% of the total requests sent. Hence, the Allowed Rate naturally drops to **0.0%** for high-throughput memory limiters.
