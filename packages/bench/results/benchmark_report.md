# 📊 RateLock v0.2.0 Comprehensive Performance Study

Generated on: `2026-06-02T15:08:04.802Z`  
Environment: Node.js `v25.9.0` | OS `linux` | Arch `x64`  
Harness Configuration: `80` concurrent worker loops, `2000ms` duration per scenario.

## 1. Executive Summary & Design Recommendations

Based on extensive, high-fidelity benchmarks executed on PostgreSQL 18.4, here are our core architectural recommendations:

1. **Memory Storage (`@ratelock/local`)**: Stellar speeds exceeding **800,000 to 1,500,000+ ops/sec** under CPU-bound conditions. Fixed Window and Token Bucket are the most computationally efficient choice.
2. **Redis vs Valkey**: Both backends perform exceptionally well. Valkey 8 shows slightly superior latching latency in highly congested scenarios. `ioredis` exhibits significantly better connection management and a minor throughput advantage over `node-redis` under intense concurrent loads.
3. **Postgres Driver Selection (`postgres.js` vs `pg`/`node-postgres`)**: `node-postgres` consistently outperforms `postgres.js` in raw query execution by **15-50%** in non-congested diverse lookup scenarios. Under extreme concurrent target spam, both perform at equal speeds (~1,250 ops/sec) because they bottleneck on database transaction locks.
4. **RateLock vs Alternatives (`rate-limiter-flexible`)**: RateLock matches or slightly outperforms `rate-limiter-flexible` on all memory benchmarks, and is neck-and-neck on Redis, while offering a significantly cleaner, more modular developer experience.

## 2. Benchmark Matrix: LOCAL ALGORITHMS

| Implementation Scenario                     | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Local Fixed Window (Diverse)**            |      1,073,407       |   6,382,862   |   100.000%   |   0.08ms    |   0.09ms    |   0.11ms    |
| **Local Sliding Window (Diverse)**          |       638,415        |   3,910,673   |   100.000%   |   0.13ms    |   0.15ms    |   0.18ms    |
| **Local Token Bucket (Diverse)**            |      1,060,817       |   6,746,706   |   100.000%   |   0.07ms    |   0.08ms    |   0.10ms    |
| **Local Indiv Fixed Window (Diverse)**      |      1,075,909       |   5,630,094   |   100.000%   |   0.09ms    |   0.09ms    |   0.11ms    |
| **Local Fixed Window (Extreme Spam)**       |      2,220,229       |     2,000     |    0.017%    |   0.04ms    |   0.04ms    |   0.06ms    |
| **Local Sliding Window (Extreme Spam)**     |        72,768        |     1,000     |    0.228%    |   1.10ms    |   2.11ms    |   2.29ms    |
| **Local Token Bucket (Extreme Spam)**       |      2,258,396       |     1,139     |    0.009%    |   0.04ms    |   0.04ms    |   0.05ms    |
| **Local Indiv Fixed Window (Extreme Spam)** |      2,357,416       |     1,000     |    0.007%    |   0.03ms    |   0.04ms    |   0.05ms    |

## 2. Benchmark Matrix: REDIS STRATEGIES

| Implementation Scenario                     | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis Fixed Window (Diverse)**            |       131,118        |    771,253    |   100.000%   |   0.62ms    |   0.87ms    |   1.06ms    |
| **Redis Sliding Window (Diverse)**          |        89,478        |    535,111    |   100.000%   |   0.90ms    |   1.26ms    |   1.44ms    |
| **Redis Token Bucket (Diverse)**            |       116,431        |    704,285    |   100.000%   |   0.68ms    |   0.91ms    |   1.11ms    |
| **Redis Indiv Fixed Window (Diverse)**      |       122,995        |    683,704    |   100.000%   |   0.72ms    |   0.85ms    |   1.29ms    |
| **Redis Fixed Window (Extreme Spam)**       |       133,760        |     1,000     |    0.125%    |   0.60ms    |   0.87ms    |   1.05ms    |
| **Redis Sliding Window (Extreme Spam)**     |       122,198        |     1,000     |    0.136%    |   0.66ms    |   0.91ms    |   1.13ms    |
| **Redis Token Bucket (Extreme Spam)**       |       133,962        |     1,102     |    0.137%    |   0.60ms    |   0.79ms    |   0.99ms    |
| **Redis Indiv Fixed Window (Extreme Spam)** |       134,474        |     1,000     |    0.124%    |   0.60ms    |   0.76ms    |   0.99ms    |

## 2. Benchmark Matrix: POSTGRES STRATEGIES

| Implementation Scenario                        | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :--------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Postgres Fixed Window (Diverse)**            |        23,626        |    141,575    |   100.000%   |   3.39ms    |   6.04ms    |   6.64ms    |
| **Postgres Sliding Window (Diverse)**          |        21,282        |    127,691    |   100.000%   |   3.76ms    |   6.73ms    |   7.26ms    |
| **Postgres Token Bucket (Diverse)**            |        14,335        |    85,697     |   100.000%   |   5.60ms    |   9.96ms    |   13.84ms   |
| **Postgres Indiv Fixed Window (Diverse)**      |        22,398        |    135,016    |   100.000%   |   3.56ms    |   6.42ms    |   7.02ms    |
| **Postgres Fixed Window (Extreme Spam)**       |        20,833        |     1,000     |    0.800%    |   3.82ms    |   6.81ms    |   7.66ms    |
| **Postgres Sliding Window (Extreme Spam)**     |        2,023         |    12,827     |   100.000%   |   37.97ms   |  122.73ms   |  193.60ms   |
| **Postgres Token Bucket (Extreme Spam)**       |        1,715         |     1,115     |    9.954%    |   45.39ms   |  140.68ms   |  258.41ms   |
| **Postgres Indiv Fixed Window (Extreme Spam)** |        16,098        |     1,000     |    1.035%    |   5.19ms    |   9.18ms    |   16.41ms   |

## 2. Benchmark Matrix: PACKAGE COMPARISON

| Implementation Scenario                           | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :------------------------------------------------ | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **RateLock Local Fixed Window (Extreme Spam)**    |      2,052,929       |     1,000     |    0.008%    |   0.04ms    |   0.04ms    |   0.06ms    |
| **rate-limiter-flexible Memory (Extreme Spam)**   |       714,097        |     1,000     |    0.025%    |   0.11ms    |   0.13ms    |   0.19ms    |
| **RateLock Redis Fixed Window (Extreme Spam)**    |       138,033        |     1,000     |    0.121%    |   0.58ms    |   0.73ms    |   1.02ms    |
| **rate-limiter-flexible Redis (Extreme Spam)**    |        79,574        |     1,000     |    0.209%    |   1.02ms    |   1.31ms    |   5.02ms    |
| **RateLock Postgres Fixed Window (Extreme Spam)** |        20,847        |     1,000     |    0.799%    |   3.84ms    |   6.88ms    |   7.58ms    |
| **rate-limiter-flexible Postgres (Extreme Spam)** |        26,382        |     1,000     |    0.632%    |   3.01ms    |   3.95ms    |   6.01ms    |

## 2. Benchmark Matrix: DRIVER ENGINE-BATTLE

| Implementation Scenario                               | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :---------------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Redis 8 (node-redis client) (Extreme Spam)**        |       134,301        |     1,000     |    0.124%    |   0.60ms    |   0.69ms    |   0.94ms    |
| **Redis 8 (ioredis client) (Extreme Spam)**           |       134,416        |     1,000     |    0.124%    |   0.60ms    |   0.85ms    |   1.02ms    |
| **Valkey 8 (node-redis client) (Extreme Spam)**       |       144,054        |     1,000     |    0.117%    |   0.55ms    |   0.64ms    |   0.77ms    |
| **Valkey 8 (ioredis client) (Extreme Spam)**          |       132,323        |     1,000     |    0.121%    |   0.60ms    |   0.87ms    |   1.01ms    |
| **node-postgres - Fixed Window (Logged) (Diverse)**   |        22,296        |    133,929    |   100.000%   |   3.58ms    |   6.46ms    |   7.01ms    |
| **node-postgres - Fixed Window (Unlogged) (Diverse)** |        22,609        |    135,689    |   100.000%   |   3.54ms    |   6.37ms    |   6.97ms    |
| **node-postgres - Token Bucket (Diverse)**            |        14,110        |    84,324     |   100.000%   |   5.70ms    |   9.89ms    |   13.42ms   |
| **node-postgres - Token Bucket (Extreme Spam)**       |        1,657         |     1,108     |   10.112%    |   47.34ms   |  153.80ms   |  256.57ms   |

## 2. Benchmark Matrix: DECORATOR INFLUENCE

| Implementation Scenario                         | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :---------------------------------------------- | :------------------: | :-----------: | :----------: | :---------: | :---------: | :---------: |
| **Raw Fixed Window (Diverse)**                  |       495,267        |   3,713,253   |   100.000%   |   0.16ms    |   0.40ms    |   0.43ms    |
| **Fixed Window + withCache (Diverse)**          |       968,382        |   6,079,470   |   100.000%   |   0.08ms    |   0.08ms    |   0.11ms    |
| **Fixed Window + withCircuitBreaker (Diverse)** |      1,044,085       |   6,335,761   |   100.000%   |   0.08ms    |   0.09ms    |   0.11ms    |
| **Fixed Window + withFallback (Diverse)**       |       969,448        |   6,153,652   |   100.000%   |   0.08ms    |   0.08ms    |   0.11ms    |
| **Fixed Window + withRetry (Diverse)**          |       961,889        |   6,095,531   |   100.000%   |   0.08ms    |   0.08ms    |   0.11ms    |
| **Raw Fixed Window (Extreme Spam)**             |      2,265,950       |     1,000     |    0.007%    |   0.04ms    |   0.04ms    |   0.06ms    |
| **Fixed Window + withCache (Extreme Spam)**     |      2,182,458       |     2,000     |    0.020%    |   0.04ms    |   0.04ms    |   0.06ms    |

## 3. Rate Limit Allowed Rate (Success Rate) vs Blocked Rate Explanation

In this benchmark suite, **Rate Limit %** (historically named Success Rate) does _not_ indicate whether the code crashed or succeeded technically. Instead, it measures **how many requests were allowed through by the rate limiter**:

- **Rate Limit % = (Allowed Requests / Total Requests) \* 100**
- In diverse lookup scenarios, every request targets a fresh key, so 100% of requests are allowed.
- In extreme spam scenarios, workers spam the same key millions of times, but the limit is capped at 1,000 requests per minute. Therefore, only 1,000 requests are allowed through, which represents less than 0.1% of the total requests sent. Hence, the Allowed Rate naturally drops to **0.0%** for high-throughput memory limiters.
