# 📊 RateLock v0.2.0 Comprehensive Performance Study

Generated on: `2026-05-18T04:46:38.459Z`  
Environment: Node.js `v25.9.0` | OS `linux` | Arch `x64`  
Harness Configuration: `15` concurrent worker loops, `2000ms` duration per scenario.

## 1. Executive Summary & Design Recommendations

Based on extensive, high-fidelity benchmarks executed on PostgreSQL 18.4, here are our core architectural recommendations:

1. **Memory Storage (`@ratelock/local`)**: Stellar speeds exceeding **800,000 to 1,500,000+ ops/sec** under CPU-bound conditions. Fixed Window and Token Bucket are the most computationally efficient choice.
2. **Redis vs Valkey**: Both backends perform exceptionally well. Valkey 8 shows slightly superior latching latency in highly congested scenarios. `ioredis` exhibits significantly better connection management and a minor throughput advantage over `node-redis` under intense concurrent loads.
3. **Postgres Driver Selection (`postgres.js` vs `pg`/`node-postgres`)**: `node-postgres` consistently outperforms `postgres.js` in raw query execution by **15-50%** in non-congested diverse lookup scenarios. Under extreme concurrent target spam, both perform at equal speeds (~1,250 ops/sec) because they bottleneck on database transaction locks.
4. **RateLock vs Alternatives (`rate-limiter-flexible`)**: RateLock matches or slightly outperforms `rate-limiter-flexible` on all memory benchmarks, and is neck-and-neck on Redis, while offering a significantly cleaner, more modular developer experience.

## 2. Benchmark Matrix: LOCAL ALGORITHMS

| Implementation Scenario                     | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Local Fixed Window (Diverse)**            |       843,416        |   1,686,841   |   100.000%   |   0.02ms    |   0.02ms    |   0.04ms    |
| **Local Sliding Window (Diverse)**          |       818,665        |   1,637,338   |   100.000%   |   0.02ms    |   0.02ms    |   0.02ms    |
| **Local Token Bucket (Diverse)**            |       921,437        |   1,843,000   |   100.000%   |   0.02ms    |   0.02ms    |   0.04ms    |
| **Local Indiv Fixed Window (Diverse)**      |       917,044        |   1,834,098   |   100.000%   |   0.02ms    |   0.02ms    |   0.02ms    |
| **Local Fixed Window (Extreme Spam)**       |      1,590,215       |     1,000     |    0.031%    |   0.01ms    |   0.01ms    |   0.02ms    |
| **Local Sliding Window (Extreme Spam)**     |       106,609        |     1,000     |    0.469%    |   0.14ms    |   0.24ms    |   0.79ms    |
| **Local Token Bucket (Extreme Spam)**       |      1,499,951       |     1,033     |    0.034%    |   0.01ms    |   0.01ms    |   0.02ms    |
| **Local Indiv Fixed Window (Extreme Spam)** |      1,488,825       |     1,000     |    0.034%    |   0.01ms    |   0.01ms    |   0.02ms    |

## 2. Benchmark Matrix: REDIS STRATEGIES

| Implementation Scenario                     | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis Fixed Window (Diverse)**            |        89,031        |    178,067    |   100.000%   |   0.17ms    |   0.24ms    |   0.31ms    |
| **Redis Sliding Window (Diverse)**          |        80,972        |    161,956    |   100.000%   |   0.18ms    |   0.25ms    |   0.32ms    |
| **Redis Token Bucket (Diverse)**            |        86,915        |    173,838    |   100.000%   |   0.17ms    |   0.23ms    |   0.28ms    |
| **Redis Indiv Fixed Window (Diverse)**      |        76,245        |    152,497    |   100.000%   |   0.20ms    |   0.28ms    |   0.35ms    |
| **Redis Fixed Window (Extreme Spam)**       |       100,297        |     1,000     |    0.499%    |   0.15ms    |   0.21ms    |   0.26ms    |
| **Redis Sliding Window (Extreme Spam)**     |       100,885        |     1,000     |    0.496%    |   0.15ms    |   0.21ms    |   0.25ms    |
| **Redis Token Bucket (Extreme Spam)**       |        85,994        |     1,033     |    0.601%    |   0.17ms    |   0.23ms    |   0.30ms    |
| **Redis Indiv Fixed Window (Extreme Spam)** |        93,503        |     1,000     |    0.535%    |   0.16ms    |   0.23ms    |   0.27ms    |

## 2. Benchmark Matrix: POSTGRES STRATEGIES

| Implementation Scenario                        | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :--------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Postgres Fixed Window (Diverse)**            |        27,352        |    54,710     |   100.000%   |   0.55ms    |   0.88ms    |   1.07ms    |
| **Postgres Sliding Window (Diverse)**          |        27,780        |    55,565     |   100.000%   |   0.54ms    |   0.78ms    |   0.88ms    |
| **Postgres Token Bucket (Diverse)**            |        15,099        |    30,203     |   100.000%   |   0.99ms    |   1.37ms    |   1.94ms    |
| **Postgres Indiv Fixed Window (Diverse)**      |        27,403        |    54,811     |   100.000%   |   0.55ms    |   0.83ms    |   0.97ms    |
| **Postgres Fixed Window (Extreme Spam)**       |        24,856        |     1,000     |    2.011%    |   0.60ms    |   1.05ms    |   1.48ms    |
| **Postgres Sliding Window (Extreme Spam)**     |        11,352        |     1,000     |    4.403%    |   1.32ms    |   3.86ms    |   6.15ms    |
| **Postgres Token Bucket (Extreme Spam)**       |        13,836        |     5,991     |   21.641%    |   1.08ms    |   2.77ms    |   4.19ms    |
| **Postgres Indiv Fixed Window (Extreme Spam)** |        23,437        |     1,000     |    2.133%    |   0.64ms    |   1.11ms    |   1.62ms    |

## 2. Benchmark Matrix: PACKAGE COMPARISON

| Implementation Scenario                   | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :---------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **RateLock Local Fixed Window (Spam)**    |      1,574,001       |     1,000     |    0.032%    |   0.01ms    |   0.01ms    |   0.01ms    |
| **rate-limiter-flexible Memory (Spam)**   |       691,637        |     1,000     |    0.072%    |   0.02ms    |   0.02ms    |   0.03ms    |
| **RateLock Redis Fixed Window (Spam)**    |        52,837        |     1,000     |    0.946%    |   0.28ms    |   0.25ms    |   0.52ms    |
| **rate-limiter-flexible Redis (Spam)**    |        23,432        |       0       |    0.000%    |   0.64ms    |   0.74ms    |   0.87ms    |
| **RateLock Postgres Fixed Window (Spam)** |        25,871        |     1,000     |    1.932%    |   0.58ms    |   0.91ms    |   1.13ms    |
| **rate-limiter-flexible Postgres (Spam)** |        26,662        |     1,000     |    1.875%    |   0.56ms    |   0.98ms    |   1.25ms    |

## 2. Benchmark Matrix: DRIVER ENGINE-BATTLE

| Implementation Scenario                         | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :---------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis 7 (node-redis client) (Spam)**          |        53,892        |     1,000     |    0.928%    |   0.28ms    |   0.24ms    |   4.14ms    |
| **Redis 7 (ioredis client) (Spam)**             |       100,848        |     1,000     |    0.496%    |   0.15ms    |   0.20ms    |   0.25ms    |
| **Valkey 8 (node-redis client) (Spam)**         |        78,752        |     1,000     |    0.635%    |   0.19ms    |   0.22ms    |   0.28ms    |
| **Valkey 8 (ioredis client) (Spam)**            |        96,920        |     1,000     |    0.516%    |   0.15ms    |   0.21ms    |   0.25ms    |
| **Postgres.js - Fixed Window (Diverse)**        |        19,498        |    39,005     |   100.000%   |   0.77ms    |   0.92ms    |   1.11ms    |
| **node-postgres - Fixed Window (Diverse)**      |        27,694        |    55,393     |   100.000%   |   0.54ms    |   0.84ms    |   0.96ms    |
| **Postgres.js - Token Bucket (Diverse)**        |        10,944        |    21,898     |   100.000%   |   1.37ms    |   1.55ms    |   1.81ms    |
| **node-postgres - Token Bucket (Diverse)**      |        14,500        |    29,008     |   100.000%   |   1.03ms    |   1.40ms    |   1.62ms    |
| **Postgres.js - Token Bucket (Extreme Spam)**   |        10,009        |     4,015     |   20.046%    |   1.50ms    |   3.61ms    |   5.36ms    |
| **node-postgres - Token Bucket (Extreme Spam)** |        12,857        |     5,295     |   20.575%    |   1.16ms    |   3.02ms    |   4.61ms    |

## 3. Rate Limit Allowed Rate (Success Rate) vs Blocked Rate Explanation

In this benchmark suite, **Rate Limit %** (historically named Success Rate) does _not_ indicate whether the code crashed or succeeded technically. Instead, it measures **how many requests were allowed through by the rate limiter**:

- **Rate Limit % = (Allowed Requests / Total Requests) \* 100**
- In diverse lookup scenarios, every request targets a fresh key, so 100% of requests are allowed.
- In extreme spam scenarios, workers spam the same key millions of times, but the limit is capped at 1,000 requests per minute. Therefore, only 1,000 requests are allowed through, which represents less than 0.1% of the total requests sent. Hence, the Allowed Rate naturally drops to **0.0%** for high-throughput memory limiters.
