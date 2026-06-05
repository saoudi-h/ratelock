# 📊 RateLock v0.2.0 Comprehensive Performance Study

Generated on: `2026-06-05T16:33:26.722Z`  
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
| **Local Fixed Window (Diverse)**            |      1,131,651       |   6,921,824   |   100.000%   |   0.07ms    |   0.08ms    |   0.11ms    |
| **Local Sliding Window (Diverse)**          |       667,297        |   4,480,700   |   100.000%   |   0.11ms    |   0.12ms    |   0.16ms    |
| **Local Token Bucket (Diverse)**            |      1,102,354       |   6,682,949   |   100.000%   |   0.07ms    |   0.08ms    |   0.09ms    |
| **Local Indiv Fixed Window (Diverse)**      |       875,364        |   5,385,695   |   100.000%   |   0.09ms    |   0.07ms    |   0.09ms    |
| **Local Fixed Window (Extreme Spam)**       |      1,761,438       |     2,000     |    0.019%    |   0.04ms    |   0.03ms    |   0.04ms    |
| **Local Sliding Window (Extreme Spam)**     |        75,201        |     1,000     |    0.226%    |   1.07ms    |   1.70ms    |   1.89ms    |
| **Local Token Bucket (Extreme Spam)**       |      2,332,474       |     1,138     |    0.008%    |   0.03ms    |   0.03ms    |   0.04ms    |
| **Local Indiv Fixed Window (Extreme Spam)** |      2,518,363       |     1,000     |    0.007%    |   0.03ms    |   0.03ms    |   0.04ms    |

## 2. Benchmark Matrix: REDIS STRATEGIES

| Implementation Scenario                     | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis Fixed Window (Diverse)**            |       141,504        |    850,866    |   100.000%   |   0.56ms    |   0.75ms    |   1.00ms    |
| **Redis Sliding Window (Diverse)**          |        97,579        |    589,209    |   100.000%   |   0.81ms    |   0.99ms    |   1.24ms    |
| **Redis Token Bucket (Diverse)**            |       119,977        |    715,588    |   100.000%   |   0.67ms    |   0.84ms    |   1.04ms    |
| **Redis Indiv Fixed Window (Diverse)**      |       130,829        |    769,434    |   100.000%   |   0.63ms    |   0.78ms    |   0.99ms    |
| **Redis Fixed Window (Extreme Spam)**       |       147,850        |     1,000     |    0.114%    |   0.54ms    |   0.64ms    |   0.87ms    |
| **Redis Sliding Window (Extreme Spam)**     |       131,288        |     1,000     |    0.127%    |   0.61ms    |   0.77ms    |   0.95ms    |
| **Redis Token Bucket (Extreme Spam)**       |       143,616        |     1,102     |    0.126%    |   0.55ms    |   0.70ms    |   0.88ms    |
| **Redis Indiv Fixed Window (Extreme Spam)** |       143,612        |     1,000     |    0.115%    |   0.56ms    |   0.67ms    |   0.90ms    |

## 2. Benchmark Matrix: POSTGRES STRATEGIES

| Implementation Scenario                        | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :--------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Postgres Fixed Window (Diverse)**            |        30,498        |    182,980    |   100.000%   |   2.62ms    |   3.44ms    |   5.23ms    |
| **Postgres Sliding Window (Diverse)**          |        27,352        |    164,564    |   100.000%   |   2.92ms    |   4.94ms    |   6.03ms    |
| **Postgres Token Bucket (Diverse)**            |        24,450        |    145,189    |   100.000%   |   3.31ms    |   5.90ms    |   6.49ms    |
| **Postgres Indiv Fixed Window (Diverse)**      |        28,624        |    171,922    |   100.000%   |   2.79ms    |   4.27ms    |   5.57ms    |
| **Postgres Fixed Window (Extreme Spam)**       |        29,318        |     2,001     |    1.138%    |   2.72ms    |   4.74ms    |   5.49ms    |
| **Postgres Sliding Window (Extreme Spam)**     |        19,247        |     1,000     |    0.871%    |   4.16ms    |   7.51ms    |   8.52ms    |
| **Postgres Token Bucket (Extreme Spam)**       |        1,730         |     1,112     |    9.860%    |   45.40ms   |  138.81ms   |  232.33ms   |
| **Postgres Indiv Fixed Window (Extreme Spam)** |        23,416        |     1,000     |    0.711%    |   3.44ms    |   6.21ms    |   6.82ms    |

## 2. Benchmark Matrix: PACKAGE COMPARISON

| Implementation Scenario                           | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **RateLock Local Fixed Window (Extreme Spam)**    |      2,140,391       |     1,000     |    0.008%    |   0.04ms    |   0.04ms    |   0.05ms    |
| **rate-limiter-flexible Memory (Extreme Spam)**   |       746,094        |     1,000     |    0.022%    |   0.11ms    |   0.11ms    |   0.15ms    |
| **RateLock Redis Fixed Window (Extreme Spam)**    |       136,197        |     1,000     |    0.122%    |   0.59ms    |   0.87ms    |   1.10ms    |
| **rate-limiter-flexible Redis (Extreme Spam)**    |        81,414        |     1,000     |    0.205%    |   0.97ms    |   1.16ms    |   5.25ms    |
| **RateLock Postgres Fixed Window (Extreme Spam)** |        26,888        |     2,000     |    1.217%    |   2.94ms    |   5.11ms    |   5.88ms    |
| **rate-limiter-flexible Postgres (Extreme Spam)** |        26,886        |     1,000     |    0.633%    |   2.98ms    |   4.09ms    |   6.14ms    |

## 2. Benchmark Matrix: DRIVER ENGINE-BATTLE

| Implementation Scenario                               | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :---------------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis 7 (node-redis client) (Extreme Spam)**        |       135,649        |     1,000     |    0.123%    |   0.59ms    |   0.73ms    |   1.00ms    |
| **Redis 7 (ioredis client) (Extreme Spam)**           |       137,723        |     1,000     |    0.120%    |   0.58ms    |   0.75ms    |   1.10ms    |
| **Valkey (node-redis client) (Extreme Spam)**         |       138,830        |     1,000     |    0.120%    |   0.58ms    |   0.69ms    |   0.96ms    |
| **Valkey (ioredis client) (Extreme Spam)**            |       134,026        |     1,000     |    0.124%    |   0.60ms    |   0.91ms    |   1.09ms    |
| **Postgres.js - Fixed Window (Diverse)**              |        30,857        |    184,620    |   100.000%   |   2.60ms    |   3.89ms    |   9.48ms    |
| **node-postgres - Fixed Window (Logged) (Diverse)**   |        25,072        |    151,133    |   100.000%   |   3.18ms    |   4.01ms    |   6.39ms    |
| **node-postgres - Fixed Window (Unlogged) (Diverse)** |        25,042        |    153,503    |   100.000%   |   3.13ms    |   4.18ms    |   6.36ms    |
| **Postgres.js - Token Bucket (Diverse)**              |        21,860        |    132,241    |   100.000%   |   3.63ms    |   4.99ms    |   9.73ms    |
| **node-postgres - Token Bucket (Diverse)**            |        17,304        |    102,026    |   100.000%   |   4.71ms    |   7.78ms    |   9.59ms    |
| **Postgres.js - Token Bucket (Extreme Spam)**         |        1,521         |     1,103     |   11.173%    |   51.03ms   |  155.17ms   |  244.23ms   |
| **node-postgres - Token Bucket (Extreme Spam)**       |        1,678         |     1,107     |   10.168%    |   46.89ms   |  146.86ms   |  228.95ms   |

## 2. Benchmark Matrix: DECORATOR INFLUENCE

| Implementation Scenario                         | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :---------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Raw Fixed Window (Diverse)**                  |      1,145,813       |   6,994,534   |   100.000%   |   0.07ms    |   0.08ms    |   0.09ms    |
| **Fixed Window + withCache (Diverse)**          |      1,010,973       |   5,928,058   |   100.000%   |   0.08ms    |   0.08ms    |   0.09ms    |
| **Fixed Window + withCircuitBreaker (Diverse)** |      1,002,669       |   6,340,354   |   100.000%   |   0.08ms    |   0.08ms    |   0.10ms    |
| **Fixed Window + withFallback (Diverse)**       |       950,878        |   5,531,500   |   100.000%   |   0.09ms    |   0.10ms    |   0.13ms    |
| **Fixed Window + withRetry (Diverse)**          |       685,142        |   3,957,326   |   100.000%   |   0.15ms    |   0.25ms    |   0.28ms    |
| **Raw Fixed Window (Extreme Spam)**             |      2,194,468       |     1,000     |    0.007%    |   0.05ms    |   0.04ms    |   0.06ms    |
| **Fixed Window + withCache (Extreme Spam)**     |      2,214,857       |     1,000     |    0.014%    |   0.05ms    |   0.04ms    |   0.06ms    |

## 3. Rate Limit Allowed Rate (Success Rate) vs Blocked Rate Explanation

In this benchmark suite, **Rate Limit %** (historically named Success Rate) does _not_ indicate whether the code crashed or succeeded technically. Instead, it measures **how many requests were allowed through by the rate limiter**:

- **Rate Limit % = (Allowed Requests / Total Requests) \* 100**
- In diverse lookup scenarios, every request targets a fresh key, so 100% of requests are allowed.
- In extreme spam scenarios, workers spam the same key millions of times, but the limit is capped at 1,000 requests per minute. Therefore, only 1,000 requests are allowed through, which represents less than 0.1% of the total requests sent. Hence, the Allowed Rate naturally drops to **0.0%** for high-throughput memory limiters.
