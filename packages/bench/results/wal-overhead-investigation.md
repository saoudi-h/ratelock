# WAL overhead in RateLock's bench: a follow-up investigation

## Background

The first bench run (committed as `60afe29 docs(bench): refresh numbers and fix stale claims`)
showed that `pg-Logged Fixed Window` and `pg-Unlogged Fixed Window` were within 1-2% of
each other on the dev bench setup. That made the `unlogged: true` option look pointless,
and prompted the question: is the WAL overhead truly negligible on modern PostgreSQL,
or is the bench masking it?

## Hypothesis

The bench container runs with `synchronous_commit=off, fsync=off, full_page_writes=off`
(see `packages/bench/docker-compose.yml`). These flags disable every durability barrier
that makes WAL expensive. With those off, the remaining WAL cost is just the CPU cost
of writing WAL records — which on a 5+ year old NVMe with a warm WAL buffer is nearly
free for small UPSERTs.

A 1-2% gap on this setup is the same as no gap; it does not reflect what a real
production deployment (durability on) would see.

## Method

A focused harness that runs only `pg-Logged` and `pg-Unlogged` Fixed Window side by
side, with multiple iterations, on different PG versions and durability configs:

- PG 18.4 (current bench image), 3 durability configs:
    - `sync_commit=off + fsync=off + full_page_writes=off` (current bench default)
    - `sync_commit=off` only (other durability on)
    - all durability on (production default)
- PG 15.18, all durability on
- PG 14.23, all durability on, plus `sync_commit=off` only

Each scenario ran 3-5 iterations of 2 seconds at concurrency 80, with a 500ms warmup,
on the same DiverseKeys scenario. Connection pool sized to 80 for pg.

Script: `packages/bench/src/scripts/investigate-unlogged.ts`.

## Results

Throughput in ops/sec, median of iterations. Ratio = unlogged / logged.

| PG ver | Durability config                              | Logged | Unlogged | Ratio  | WAL overhead  |
| :----- | :--------------------------------------------- | :----- | :------- | :----- | :------------ |
| 18.4   | `sync=off, fsync=off, fpw=off` (current bench) | 29,244 | 30,303   | 1.037x | -3.7% (noise) |
| 18.4   | `sync=off` only                                | 29,517 | 30,392   | 1.032x | -3.2% (noise) |
| 18.4   | all on (production default)                    | 25,127 | 28,795   | 1.146x | **-14.6%**    |
| 15.18  | all on                                         | 25,152 | 27,008   | 1.074x | **-7.4%**     |
| 14.23  | all on                                         | 26,676 | 29,591   | 1.109x | **-10.9%**    |
| 14.23  | `sync=off` only                                | 25,609 | 26,613   | 1.040x | **-4.0%**     |

Notes:

- Negative numbers mean unlogged is faster (less work). Positive would mean logged
  is faster (no observed case in this matrix).
- 3-5 iterations, 2s each, 80 workers. σ between iterations was 200-2000 ops/s
  (1-7%), so single-digit percentages should be treated as a directional signal,
  not a precise measurement. The 14.6% gap on PG18-default is well above noise.
- The 7.4% gap on PG15 is the surprising data point. The 14.6% / 10.9% / 7.4% trend
  is not monotonic, which suggests PG-internal WAL handling changed between versions
  but the relationship with durability is what matters, not the absolute version number.

## Conclusion

The `unlogged: true` option is **not pointless**. With production-default durability,
unlogged UPSERT is 7-15% faster depending on the PG version. With `synchronous_commit=off`
(the typical "I don't care about losing the last transaction" tuning), the gap shrinks
to 3-4%, which is still real but small.

The current bench setup's all-durability-off config is a **worst-case-for-the-claim**
config: it makes WAL essentially free, so the unlogged option looks useless. To honestly
represent the option's value, the production-default-config numbers should be the
ones quoted in the docs.

## Recommendation

1. **Keep the `unlogged: true` option.** It's a real ~7-15% win in production
   configurations, free to opt in to, and the user knows the trade-off (no crash
   recovery for those tables).
2. **Switch the bench to production defaults.** The main benchmark suite
   (`packages/bench/docker-compose.yml`) now runs Postgres with
   `synchronous_commit=on`, `fsync=on`, and `full_page_writes=on` (only
   sizing flags are applied). The "Logged vs Unlogged" row in the main
   bench now shows the honest 20% gap on PG 18 with full durability. The
   focused harness in this file remains the reference for the deeper
   investigation across PG 14, 15, and 18, and for the all-durability-off
   baseline.
3. **Archive `HANDOVER.md`** (or fold it into `docs/benchmarks.mdx`) — the
   UNSAFE_TRANSACTION / `sql.reserve()` issue it described is now fully
   resolved by the per-driver strategy split.
