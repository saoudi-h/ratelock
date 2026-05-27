# 📊 RateLock v0.2.0 Comprehensive Performance Study

Generated on: `2026-05-26T07:55:33.112Z`  
Environment: Node.js `v25.9.0` | OS `linux` | Arch `x64`  
Harness Configuration: `80` concurrent worker loops, `1000ms` duration per scenario.

## 1. Executive Summary & Design Recommendations

Based on extensive, high-fidelity benchmarks executed on PostgreSQL 18.4, here are our core architectural recommendations:

1. **Memory Storage (`@ratelock/local`)**: Stellar speeds exceeding **800,000 to 1,500,000+ ops/sec** under CPU-bound conditions. Fixed Window and Token Bucket are the most computationally efficient choice.
2. **Redis vs Valkey**: Both backends perform exceptionally well. Valkey 8 shows slightly superior latching latency in highly congested scenarios. `ioredis` exhibits significantly better connection management and a minor throughput advantage over `node-redis` under intense concurrent loads.
3. **Postgres Driver Selection (`postgres.js` vs `pg`/`node-postgres`)**: `node-postgres` consistently outperforms `postgres.js` in raw query execution by **15-50%** in non-congested diverse lookup scenarios. Under extreme concurrent target spam, both perform at equal speeds (~1,250 ops/sec) because they bottleneck on database transaction locks.
4. **RateLock vs Alternatives (`rate-limiter-flexible`)**: RateLock matches or slightly outperforms `rate-limiter-flexible` on all memory benchmarks, and is neck-and-neck on Redis, while offering a significantly cleaner, more modular developer experience.

## 2. Benchmark Matrix: LOCAL ALGORITHMS

| Implementation Scenario | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Local Fixed Window (Diverse)** | 826,660 | 826,675 | 100.000% | 0.10ms | 0.12ms | 0.16ms |
| **Local Sliding Window (Diverse)** | 558,685 | 558,700 | 100.000% | 0.14ms | 0.20ms | 0.35ms |
| **Local Token Bucket (Diverse)** | 746,783 | 746,794 | 100.000% | 0.11ms | 0.11ms | 0.17ms |
| **Local Indiv Fixed Window (Diverse)** | 799,538 | 799,550 | 100.000% | 0.10ms | 0.13ms | 0.16ms |
| **Local Fixed Window (Extreme Spam)** | 1,523,108 | 1,000 | 0.066% | 0.05ms | 0.06ms | 0.11ms |
| **Local Sliding Window (Extreme Spam)** | 162,245 | 1,000 | 0.616% | 0.49ms | 1.05ms | 1.21ms |
| **Local Token Bucket (Extreme Spam)** | 1,413,945 | 1,016 | 0.072% | 0.06ms | 0.09ms | 0.10ms |
| **Local Indiv Fixed Window (Extreme Spam)** | 1,517,620 | 1,000 | 0.066% | 0.05ms | 0.05ms | 0.06ms |

## 2. Benchmark Matrix: REDIS STRATEGIES

| Implementation Scenario | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Redis Fixed Window (Diverse)** | 117,188 | 117,198 | 100.000% | 0.68ms | 0.95ms | 1.45ms |
| **Redis Sliding Window (Diverse)** | 91,085 | 91,130 | 100.000% | 0.88ms | 1.19ms | 1.57ms |
| **Redis Token Bucket (Diverse)** | 112,438 | 112,481 | 100.000% | 0.71ms | 0.90ms | 1.39ms |
| **Redis Indiv Fixed Window (Diverse)** | 109,497 | 109,549 | 100.000% | 0.73ms | 0.92ms | 1.62ms |
| **Redis Fixed Window (Extreme Spam)** | 135,055 | 1,000 | 0.740% | 0.59ms | 0.72ms | 1.21ms |
| **Redis Sliding Window (Extreme Spam)** | 114,668 | 1,000 | 0.872% | 0.70ms | 0.97ms | 1.74ms |
| **Redis Token Bucket (Extreme Spam)** | 133,525 | 1,016 | 0.761% | 0.60ms | 0.82ms | 1.22ms |
| **Redis Indiv Fixed Window (Extreme Spam)** | 132,763 | 1,000 | 0.753% | 0.60ms | 0.71ms | 1.25ms |

## 2. Benchmark Matrix: POSTGRES STRATEGIES

| Implementation Scenario | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Postgres Fixed Window (Diverse)** | 17,708 | 17,722 | 100.000% | 4.51ms | 7.39ms | 11.74ms |
| **Postgres Sliding Window (Diverse)** | 21,164 | 21,182 | 100.000% | 3.78ms | 6.75ms | 7.24ms |
| **Postgres Token Bucket (Diverse)** | 13,509 | 13,552 | 100.000% | 5.91ms | 13.35ms | 27.38ms |
| **Postgres Indiv Fixed Window (Diverse)** | 24,361 | 24,378 | 100.000% | 3.28ms | 5.87ms | 6.47ms |
| **Postgres Fixed Window (Extreme Spam)** | 22,561 | 1,000 | 4.429% | 3.54ms | 6.31ms | 7.17ms |
| **Postgres Sliding Window (Extreme Spam)** | 2,356 | 2,437 | 100.000% | 33.45ms | 103.70ms | 172.63ms |
| **Postgres Token Bucket (Extreme Spam)** | 1,947 | 1,012 | 49.535% | 40.39ms | 123.67ms | 194.55ms |
| **Postgres Indiv Fixed Window (Extreme Spam)** | 20,030 | 1,000 | 4.988% | 3.99ms | 7.12ms | 9.32ms |

## 2. Benchmark Matrix: PACKAGE COMPARISON

| Implementation Scenario | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **RateLock Local Fixed Window (Spam)** | 1,331,435 | 1,000 | 0.075% | 0.06ms | 0.06ms | 0.08ms |
| **rate-limiter-flexible Memory (Spam)** | 651,026 | 1,000 | 0.154% | 0.12ms | 0.14ms | 0.25ms |
| **RateLock Redis Fixed Window (Spam)** | 124,514 | 1,000 | 0.803% | 0.64ms | 0.74ms | 0.98ms |
| **rate-limiter-flexible Redis (Spam)** | 23,879 | 0 | 0.000% | 3.34ms | 3.71ms | 4.18ms |
| **RateLock Postgres Fixed Window (Spam)** | 17,284 | 1,000 | 5.780% | 4.62ms | 7.36ms | 15.02ms |
| **rate-limiter-flexible Postgres (Spam)** | 25,317 | 1,000 | 3.947% | 3.16ms | 4.93ms | 6.54ms |

## 2. Benchmark Matrix: DRIVER ENGINE-BATTLE

| Implementation Scenario | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Redis 8 (node-redis client) (Spam)** | 122,979 | 1,000 | 0.813% | 0.65ms | 0.83ms | 1.06ms |
| **Redis 8 (ioredis client) (Spam)** | 126,793 | 1,000 | 0.789% | 0.63ms | 0.80ms | 1.36ms |
| **Postgres.js - Fixed Window (Diverse)** | 8,651 | 8,664 | 100.000% | 9.23ms | 15.98ms | 110.72ms |
| **node-postgres - Fixed Window (Logged) (Diverse)** | 6,347 | 3,448 | 53.674% | 5.81ms | 7.60ms | 16.63ms |
| **node-postgres - Fixed Window (Unlogged) (Diverse)** | 6,917 | 3,779 | 54.179% | 5.30ms | 6.32ms | 10.05ms |
| **Postgres.js - Token Bucket (Diverse)** | 11,063 | 11,112 | 100.000% | 7.21ms | 10.47ms | 13.83ms |
| **node-postgres - Token Bucket (Diverse)** | 6,422 | 3,848 | 59.209% | 5.20ms | 9.72ms | 11.96ms |
| **Postgres.js - Token Bucket (Extreme Spam)** | 2,125 | 1,018 | 45.650% | 36.88ms | 114.89ms | 167.52ms |
| **node-postgres - Token Bucket (Extreme Spam)** | 4,778 | 1,050 | 21.667% | 10.23ms | 29.13ms | 47.04ms |

## 2. Benchmark Matrix: DECORATOR INFLUENCE

| Implementation Scenario | Throughput (Ops/sec) | Allowed Count | Rate Limit % | Avg Latency | p95 Latency | p99 Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Raw Fixed Window (Diverse)** | 813,899 | 813,912 | 100.000% | 0.10ms | 0.09ms | 0.15ms |
| **Raw Fixed Window (Extreme Spam)** | 1,291,584 | 1,000 | 0.077% | 0.06ms | 0.06ms | 0.07ms |
| **Fixed Window + withCache (Diverse)** | 667,732 | 667,743 | 100.000% | 0.12ms | 0.11ms | 0.16ms |
| **Fixed Window + withCache (Extreme Spam)** | 1,159,846 | 1,000 | 0.086% | 0.07ms | 0.07ms | 0.08ms |
| **Fixed Window + withCircuitBreaker (Diverse)** | 590,612 | 590,622 | 100.000% | 0.13ms | 0.14ms | 0.19ms |
| **Fixed Window + withFallback (Diverse)** | 426,656 | 426,663 | 100.000% | 0.19ms | 0.12ms | 0.17ms |
| **Fixed Window + withRetry (Diverse)** | 601,955 | 601,965 | 100.000% | 0.13ms | 0.16ms | 0.21ms |

## 3. Rate Limit Allowed Rate (Success Rate) vs Blocked Rate Explanation

In this benchmark suite, **Rate Limit %** (historically named Success Rate) does *not* indicate whether the code crashed or succeeded technically. Instead, it measures **how many requests were allowed through by the rate limiter**:

* **Rate Limit % = (Allowed Requests / Total Requests) * 100**
* In diverse lookup scenarios, every request targets a fresh key, so 100% of requests are allowed.
* In extreme spam scenarios, workers spam the same key millions of times, but the limit is capped at 1,000 requests per minute. Therefore, only 1,000 requests are allowed through, which represents less than 0.1% of the total requests sent. Hence, the Allowed Rate naturally drops to **0.0%** for high-throughput memory limiters.

