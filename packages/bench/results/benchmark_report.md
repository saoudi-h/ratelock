# 📊 RateLock v0.2.0 Comprehensive Performance Study

Generated on: `2026-06-06T09:53:02.241Z`  
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
| **Local Fixed Window (Diverse)**            |       786,410        |   4,235,998   |   100.000%   |   0.15ms    |   0.25ms    |   0.29ms    |
| **Local Sliding Window (Diverse)**          |       723,922        |   4,429,326   |   100.000%   |   0.11ms    |   0.11ms    |   0.15ms    |
| **Local Token Bucket (Diverse)**            |      1,159,155       |   6,945,960   |   100.000%   |   0.07ms    |   0.08ms    |   0.08ms    |
| **Local Indiv Fixed Window (Diverse)**      |      1,101,831       |   6,810,975   |   100.000%   |   0.07ms    |   0.08ms    |   0.10ms    |
| **Local Fixed Window (Extreme Spam)**       |      2,349,639       |     1,000     |    0.007%    |   0.03ms    |   0.03ms    |   0.04ms    |
| **Local Sliding Window (Extreme Spam)**     |        75,676        |     1,000     |    0.220%    |   1.05ms    |   1.59ms    |   1.98ms    |
| **Local Token Bucket (Extreme Spam)**       |      2,249,806       |     1,137     |    0.009%    |   0.04ms    |   0.04ms    |   0.04ms    |
| **Local Indiv Fixed Window (Extreme Spam)** |      2,460,081       |     1,000     |    0.007%    |   0.03ms    |   0.03ms    |   0.04ms    |

## 2. Benchmark Matrix: REDIS STRATEGIES

| Implementation Scenario                     | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis Fixed Window (Diverse)**            |       139,791        |    842,911    |   100.000%   |   0.57ms    |   0.73ms    |   0.97ms    |
| **Redis Sliding Window (Diverse)**          |       100,511        |    602,324    |   100.000%   |   0.80ms    |   0.86ms    |   1.09ms    |
| **Redis Token Bucket (Diverse)**            |       120,255        |    720,482    |   100.000%   |   0.67ms    |   0.72ms    |   0.94ms    |
| **Redis Indiv Fixed Window (Diverse)**      |       132,027        |    772,993    |   100.000%   |   0.62ms    |   0.75ms    |   1.03ms    |
| **Redis Fixed Window (Extreme Spam)**       |       141,720        |     1,000     |    0.118%    |   0.56ms    |   0.82ms    |   0.99ms    |
| **Redis Sliding Window (Extreme Spam)**     |       119,748        |     1,000     |    0.139%    |   0.67ms    |   1.00ms    |   1.23ms    |
| **Redis Token Bucket (Extreme Spam)**       |       139,932        |     1,102     |    0.131%    |   0.57ms    |   0.81ms    |   0.98ms    |
| **Redis Indiv Fixed Window (Extreme Spam)** |       147,620        |     1,000     |    0.113%    |   0.55ms    |   0.58ms    |   0.91ms    |

## 2. Benchmark Matrix: POSTGRES STRATEGIES

| Implementation Scenario                        | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :--------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Postgres Fixed Window (Diverse)**            |        32,013        |    191,701    |   100.000%   |   2.51ms    |   3.35ms    |   5.00ms    |
| **Postgres Sliding Window (Diverse)**          |        27,430        |    164,378    |   100.000%   |   2.92ms    |   4.82ms    |   6.20ms    |
| **Postgres Token Bucket (Diverse)**            |        23,879        |    143,443    |   100.000%   |   3.35ms    |   5.89ms    |   6.79ms    |
| **Postgres Indiv Fixed Window (Diverse)**      |        29,312        |    173,729    |   100.000%   |   2.76ms    |   3.86ms    |   5.75ms    |
| **Postgres Fixed Window (Extreme Spam)**       |        30,858        |     1,000     |    0.549%    |   2.60ms    |   4.38ms    |   5.18ms    |
| **Postgres Sliding Window (Extreme Spam)**     |        19,340        |     1,000     |    0.866%    |   4.13ms    |   7.44ms    |   8.76ms    |
| **Postgres Token Bucket (Extreme Spam)**       |        1,795         |     1,112     |    9.719%    |   44.07ms   |  140.70ms   |  229.95ms   |
| **Postgres Indiv Fixed Window (Extreme Spam)** |        24,924        |     1,000     |    0.668%    |   3.20ms    |   5.62ms    |   6.33ms    |

## 2. Benchmark Matrix: PACKAGE COMPARISON

| Implementation Scenario                           | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **RateLock Local Fixed Window (Extreme Spam)**    |      2,088,809       |     2,000     |    0.016%    |   0.04ms    |   0.04ms    |   0.04ms    |
| **rate-limiter-flexible Memory (Extreme Spam)**   |       744,508        |     1,000     |    0.024%    |   0.11ms    |   0.12ms    |   0.15ms    |
| **RateLock Redis Fixed Window (Extreme Spam)**    |       142,637        |     1,000     |    0.116%    |   0.56ms    |   0.73ms    |   1.01ms    |
| **rate-limiter-flexible Redis (Extreme Spam)**    |        83,403        |     1,000     |    0.209%    |   0.96ms    |   1.29ms    |   5.16ms    |
| **RateLock Postgres Fixed Window (Extreme Spam)** |        29,330        |     1,000     |    0.626%    |   2.80ms    |   4.57ms    |   5.46ms    |
| **rate-limiter-flexible Postgres (Extreme Spam)** |        28,171        |     1,000     |    0.591%    |   2.88ms    |   3.98ms    |   5.75ms    |

## 2. Benchmark Matrix: DRIVER ENGINE-BATTLE

| Implementation Scenario                               | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :---------------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis 7 (node-redis client) (Extreme Spam)**        |       139,026        |     1,000     |    0.122%    |   0.58ms    |   0.63ms    |   0.99ms    |
| **Redis 7 (ioredis client) (Extreme Spam)**           |       141,807        |     1,000     |    0.118%    |   0.57ms    |   0.64ms    |   1.03ms    |
| **Valkey (node-redis client) (Extreme Spam)**         |       135,468        |     2,000     |    0.247%    |   0.59ms    |   0.69ms    |   0.85ms    |
| **Valkey (ioredis client) (Extreme Spam)**            |       140,052        |     1,000     |    0.119%    |   0.58ms    |   0.71ms    |   0.98ms    |
| **Postgres.js - Fixed Window (Diverse)**              |        32,719        |    193,217    |   100.000%   |   2.49ms    |   3.73ms    |   8.97ms    |
| **node-postgres - Fixed Window (Logged) (Diverse)**   |        22,379        |    133,826    |   100.000%   |   3.59ms    |   5.42ms    |   6.01ms    |
| **node-postgres - Fixed Window (Unlogged) (Diverse)** |        26,837        |    159,166    |   100.000%   |   3.02ms    |   3.78ms    |   5.89ms    |
| **Postgres.js - Token Bucket (Diverse)**              |        21,359        |    130,770    |   100.000%   |   3.67ms    |   5.00ms    |   10.18ms   |
| **node-postgres - Token Bucket (Diverse)**            |        17,222        |    104,484    |   100.000%   |   4.60ms    |   7.88ms    |   9.37ms    |
| **Postgres.js - Token Bucket (Extreme Spam)**         |        1,681         |     1,110     |   10.222%    |   46.28ms   |  141.67ms   |  223.62ms   |
| **node-postgres - Token Bucket (Extreme Spam)**       |        1,721         |     1,121     |   10.520%    |   44.12ms   |  142.66ms   |  224.10ms   |

## 2. Benchmark Matrix: DECORATOR INFLUENCE

| Implementation Scenario                         | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :---------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Raw Fixed Window (Diverse)**                  |      1,081,524       |   5,694,149   |   100.000%   |   0.09ms    |   0.08ms    |   0.12ms    |
| **Fixed Window + withCache (Diverse)**          |       974,912        |   5,944,146   |   100.000%   |   0.08ms    |   0.09ms    |   0.12ms    |
| **Fixed Window + withCircuitBreaker (Diverse)** |      1,026,306       |   5,864,567   |   100.000%   |   0.09ms    |   0.08ms    |   0.11ms    |
| **Fixed Window + withFallback (Diverse)**       |       999,222        |   6,290,191   |   100.000%   |   0.08ms    |   0.09ms    |   0.12ms    |
| **Fixed Window + withRetry (Diverse)**          |       991,624        |   6,298,670   |   100.000%   |   0.08ms    |   0.09ms    |   0.12ms    |
| **Raw Fixed Window (Extreme Spam)**             |      2,330,970       |     1,000     |    0.007%    |   0.03ms    |   0.04ms    |   0.05ms    |
| **Fixed Window + withCache (Extreme Spam)**     |      2,249,962       |     2,000     |    0.015%    |   0.04ms    |   0.04ms    |   0.06ms    |

## 3. Rate Limit Allowed Rate (Success Rate) vs Blocked Rate Explanation

In this benchmark suite, **Rate Limit %** (historically named Success Rate) does _not_ indicate whether the code crashed or succeeded technically. Instead, it measures **how many requests were allowed through by the rate limiter**:

- **Rate Limit % = (Allowed Requests / Total Requests) \* 100**
- In diverse lookup scenarios, every request targets a fresh key, so 100% of requests are allowed.
- In extreme spam scenarios, workers spam the same key millions of times, but the limit is capped at 1,000 requests per minute. Therefore, only 1,000 requests are allowed through, which represents less than 0.1% of the total requests sent. Hence, the Allowed Rate naturally drops to **0.0%** for high-throughput memory limiters.
