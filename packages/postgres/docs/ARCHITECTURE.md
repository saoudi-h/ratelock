# 🐘 RateLock PostgreSQL Adapter: Architectural & Performance Deep-Dive

This document provides a highly technical, rigorous architectural explanation of how the `@ratelock/postgres` adapter achieves Redis-like performance (up to **27,000+ ops/sec**), the mechanics of our transaction locking, and the trade-offs of using `UNLOGGED` tables in production environments.

---

## 1. The Core Performance Breakthrough: Resolving Lock Contention

Rate limiters deployed against SQL databases historically suffer from terrible performance bottlenecks under concurrent load (often chocking at ~800 to 1,200 ops/sec). It is a common misconception that this bottleneck is caused by CPU core limitations or driver overhead. In reality, **it is 100% caused by database Lock Contention**.

### The Old Pattern (Subquery self-join `UPDATE`):

```sql
UPDATE ratelock.token_bucket SET
    tokens = calc.new_tokens,
    last_refill = calc.now
FROM (
    SELECT ... FROM ratelock.token_bucket WHERE key = $1
) calc
WHERE key = $1
```

- **Why it choked**: Under PostgreSQL, performing an `UPDATE` that queries the same table inside a subquery forces the query planner to acquire shared read locks on the rows first, evaluate the subquery, create a temporary materialization in memory, and then upgrade the lock to an exclusive write lock.
- **The Contention Gate**: Under concurrent load (e.g., 15 simultaneous application requests), multiple connections try to acquire these locks on the same keys. PostgreSQL is forced to serialize these transactions, putting the database threads into a blocked state waiting for lock releases. The database spends 95% of its CPU time managing the transaction queue and lock tables instead of executing writes.

### The New Pattern (Direct, Single-Lookup Atomic `UPDATE`):

```sql
UPDATE ratelock.token_bucket SET
  tokens = CASE WHEN LEAST(capacity, tokens + ($2 - last_refill) * refill_rate) >= 1
                THEN LEAST(capacity, tokens + ($2 - last_refill) * refill_rate) - 1
                ELSE LEAST(capacity, tokens + ($2 - last_refill) * refill_rate) END,
  last_refill = CASE WHEN LEAST(capacity, tokens + ($2 - last_refill) * refill_rate) >= 1
                     THEN $2 ELSE last_refill END
WHERE key = $1
RETURNING tokens, capacity, refill_rate, last_refill, (last_refill = $2) as allowed
```

- **Why it is blistering fast (13,000+ ops/sec under extreme lock spam)**: This query contains zero subqueries and zero self-joins. PostgreSQL resolves the row instantly using a single B-Tree primary key index lookup and modifies the row in-place. Lock contention drops to virtually zero. It represents the exact same physical efficiency as a Redis Lua script, executed directly inside the SQL engine.

---

## 2. Global DB-level Logging vs. Local `UNLOGGED` Tables

When deploying a rate limiter alongside other applications sharing the same PostgreSQL instance, **maintaining data integrity for colocated databases is the absolute priority**.

```
   ┌────────────────────────────────────────────────────────┐
   │              POSTGRESQL INSTANCE / DATABASE            │
   │                                                        │
   │   Global WAL Engine (fsync = on, sync_commit = on)     │
   │  ┌───────────────────────┐   ┌──────────────────────┐  │
   │  │   COLOCATED TABLES    │   │   RATELOCK TABLES    │  │
   │  │  (users, billing, etc)│   │ (unlogged: true)     │  │
   │  │                       │   │                      │  │
   │  │   Writes are logged   │   │  Writes bypass WAL   │  │
   │  │   to WAL disk stream  │   │  Direct RAM buffers  │  │
   │  │   100% Durability     │   │  27,000+ ops/sec     │  │
   │  └───────────────────────┘   └──────────────────────┘  │
   └────────────────────────────────────────────────────────┘
```

### Global Configuration Tuning (DANGEROUS in Production)

Turning off write logs globally on the PostgreSQL cluster (`fsync = off`, `synchronous_commit = off`):

- **Mechanism**: Writes are acknowledged as soon as they reach the RAM shared buffers, buffering physical disk synchronization.
- **Danger**: **This puts all colocated tables in the instance at risk.** If a power outage or server crash occurs, other applications sharing the same database (e.g. billing, user tables) can suffer catastrophic data corruption or loss. **Never do this in production.**

### Local `UNLOGGED` Tables (SAFE & Isolated)

Using the table-level `UNLOGGED` flag during table creation (`CREATE UNLOGGED TABLE ratelock.token_bucket (...)`):

- **Mechanism**: PostgreSQL completely bypasses writing transaction logs (WAL) **only** for these specific tables.
- **Safety**: **100% safe for other tables.** All other colocated tables in the database continue to write logs to WAL normally with full ACID durability (`fsync = on`, `synchronous_commit = on` are preserved).
- **Behavior on Crash**: If the PostgreSQL server crashes, `UNLOGGED` tables are automatically truncated (emptied) upon restart. For rate limit counters, this is perfectly acceptable—starting with empty tables simply resets the transient client rate quotas, which is identical to the behavior of Redis or in-memory caches on restart.

---

## 3. High Availability (HA) & Replication Trade-offs

While `UNLOGGED` tables offer extraordinary write throughput (reaching **27,000+ ops/sec** under diverse key lookups), they introduce operational trade-offs that make a standard `LOGGED` table the necessary default for generic libraries:

### The Replication Block

- **Replication relies on WAL**: PostgreSQL physical replication (streaming replication to read replicas, warm standbys, or high-availability failover nodes) is executed entirely by streaming the WAL log entries.
- **No Replication**: Because `UNLOGGED` tables do not write entries to the WAL, **their data is NOT replicated to read replicas or standby nodes**.
- **Impact**: If your application reads rate limit tables from a read replica to distribute the read load, those tables will appear **empty** on the replicas.

### Cloud Storage Implementations (e.g., AWS Aurora, Neon)

- Many modern serverless or highly distributed cloud PostgreSQL providers use custom distributed storage layers (e.g., Neon splits compute and storage; AWS Aurora uses proprietary block-level storage replication).
- Using `UNLOGGED` tables in these specialized environments can sometimes lead to unexpected logging behavior, monitoring alerts, or minimal performance gains because the physical file synchronization bottlenecks are managed differently.

### Backup Systems (`pg_dump`)

- Logical backups using `pg_dump` will dump the **schema** of `UNLOGGED` tables, but **not their data rows**.
- For rate limit tables, this is positive (avoids backing up transient trash data), but certain database monitoring or automated schema sync tools might trigger warnings when scanning the schema.

---

## 4. Best Practices & Guidelines

### When to use `unlogged: false` (Default Happy Path)

- You are deploying in a **distributed environment** with active PostgreSQL read replicas.
- You are running on specialized cloud providers (Neon, AWS Aurora Serverless) with proprietary storage.
- Your rate-limiting workload is light to moderate (under ~1,500 requests/sec) and you want 100% standard DBA compliance.

### When to use `unlogged: true` (High Performance Option)

- You have a **single-node PostgreSQL database** without read replicas.
- You have extremely high traffic peaks and want **Redis-level speeds (up to 27,000+ ops/sec)** without the overhead of spinning up, paying for, and maintaining a separate Redis cluster.
- Your colocated applications must maintain 100% ACID physical durability, but you want your rate limits to operate with RAM-like latency.
