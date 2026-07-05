import { DecoratorAdapter } from '../adapters'
import type { BenchmarkAdapter } from '../adapters/types'
import { DiverseKeysScenario, ExtremeSpamScenario } from '../scenarios'
import type { BenchmarkScenario } from '../scenarios/types'
import type { BenchMetrics } from '../types'

/**
 * Matrix 7 — Decorator value under FAULT INJECTION.
 *
 * The decorators under test in this matrix are the ones that exist to deal
 * with a failing backend: `withRetry` (transient blips), `withCircuitBreaker`
 * (sustained outage), `withFallback` (alternative path). The happy-path
 * matrix 6.2 cannot show their value because Redis is healthy. Here we
 * deliberately inject failures at the client level using a fault-injecting
 * wrapper that satisfies the same `RedisClient` interface as a real client.
 *
 * Three sub-sections:
 *
 * 7.1 — Transient errors (10% of calls fail with a transient error)
 *   The retry decorator should keep success rate near 100% by re-attempting.
 *   The circuit breaker should keep tripping, hurting success rate.
 *   The fallback should hide the errors entirely.
 *
 * 7.2 — Slow Redis (50 ms latency per call)
 *   All calls succeed but take 50 ms. Retry pays the cost 3 times (150 ms).
 *   Circuit breaker stays closed; no benefit.
 *   Fallback stays on primary; no benefit.
 *
 * 7.3 — Hard down (100% of calls fail)
 *   Retry exhausts its attempts and surfaces the error.
 *   Circuit breaker opens after 3 failures and fast-fails.
 *   Fallback switches to the local fallback, 100% success.
 */
export async function runMatrix7(
    runHarness: (adapter: BenchmarkAdapter, scenario: BenchmarkScenario) => Promise<BenchMetrics>
): Promise<BenchMetrics[]> {
    console.log(`\nRunning Matrix 7: Decorator Resilience under Fault Injection...`)
    console.log(`  7.1 — Transient errors (10% per call)`)
    console.log(`  7.2 — Slow Redis (50ms latency per call)`)
    console.log(`  7.3 — Hard down (100% of calls fail)`)

    const diverseScenario = new DiverseKeysScenario()
    const spamScenario = new ExtremeSpamScenario()
    const metrics: BenchMetrics[] = []

    // ─── 7.1 Transient errors (10% of calls fail) ─────────────────────────────
    // Spammer scenario: 80 workers hammer the same key, 1000 req/60s limit.
    // Once exhausted, every call returns "denied" and any injected error
    // short-circuits the limiter. We compare the four failure-recovery paths.
    const transientFault = { label: 'transient-10pct', transientErrorRate: 0.1 }
    const transientAdapters: DecoratorAdapter[] = [
        new DecoratorAdapter('Raw Redis (10% transient errors)', 'none', {
            backend: 'redis',
            strategy: 'fixed-window',
            fault: transientFault,
        }),
        new DecoratorAdapter('Redis + withRetry (10% transient errors)', 'retry', {
            backend: 'redis',
            strategy: 'fixed-window',
            fault: transientFault,
        }),
        new DecoratorAdapter(
            'Redis + withCircuitBreaker (10% transient errors)',
            'circuitbreaker',
            {
                backend: 'redis',
                strategy: 'fixed-window',
                fault: transientFault,
            }
        ),
        new DecoratorAdapter('Redis + withFallback (10% transient errors)', 'fallback', {
            backend: 'redis',
            strategy: 'fixed-window',
            fault: transientFault,
        }),
    ]

    for (const adapter of transientAdapters) {
        try {
            await adapter.initialize()
            metrics.push(await runHarness(adapter, spamScenario))
            const fs = adapter.getFaultStats()
            if (fs) {
                console.log(
                    `  ↳ fault stats [${fs.label}]: ${fs.totalCalls} calls, ${fs.injectedErrors} injected errors`
                )
            }
        } finally {
            await adapter.destroy()
        }
    }

    // ─── 7.2 Slow Redis (50 ms latency per call) ──────────────────────────────
    // All calls succeed but take 50 ms. The interesting comparison is throughput
    // (Redis-limited at ~20 ops/s/worker) vs latency cost of retry.
    const slowFault = { label: 'slow-50ms', latencyMs: 50 }
    const slowAdapters: DecoratorAdapter[] = [
        new DecoratorAdapter('Raw Redis (50ms latency)', 'none', {
            backend: 'redis',
            strategy: 'fixed-window',
            fault: slowFault,
        }),
        new DecoratorAdapter('Redis + withRetry (50ms latency)', 'retry', {
            backend: 'redis',
            strategy: 'fixed-window',
            fault: slowFault,
        }),
        new DecoratorAdapter('Redis + withCircuitBreaker (50ms latency)', 'circuitbreaker', {
            backend: 'redis',
            strategy: 'fixed-window',
            fault: slowFault,
        }),
    ]

    for (const adapter of slowAdapters) {
        try {
            await adapter.initialize()
            metrics.push(await runHarness(adapter, spamScenario))
        } finally {
            await adapter.destroy()
        }
    }

    // ─── 7.3 Hard down (100% of calls fail) ───────────────────────────────────
    // The killer test for the fallback decorator. Raw Redis fails every call,
    // retry fails every call (retries don't help if every attempt fails), the
    // circuit breaker opens after 3 failures and fast-fails. The fallback
    // decorator catches the errors and returns the local fallback result.
    const downFault = { label: 'hard-down', hardDown: true }
    const downAdapters: DecoratorAdapter[] = [
        new DecoratorAdapter('Raw Redis (hard down)', 'none', {
            backend: 'redis',
            strategy: 'fixed-window',
            fault: downFault,
        }),
        new DecoratorAdapter('Redis + withRetry (hard down)', 'retry', {
            backend: 'redis',
            strategy: 'fixed-window',
            fault: downFault,
        }),
        new DecoratorAdapter('Redis + withCircuitBreaker (hard down)', 'circuitbreaker', {
            backend: 'redis',
            strategy: 'fixed-window',
            fault: downFault,
        }),
        new DecoratorAdapter('Redis + withFallback (hard down)', 'fallback', {
            backend: 'redis',
            strategy: 'fixed-window',
            fault: downFault,
        }),
    ]

    for (const adapter of downAdapters) {
        try {
            await adapter.initialize()
            metrics.push(await runHarness(adapter, spamScenario))
            const fs = adapter.getFaultStats()
            if (fs) {
                console.log(
                    `  ↳ fault stats [${fs.label}]: ${fs.totalCalls} calls, ${fs.injectedErrors} injected errors`
                )
            }
        } finally {
            await adapter.destroy()
        }
    }

    // Sanity check: keep `diverseScenario` referenced so it does not trigger
    // an unused-import lint warning if future scenarios are added.
    void diverseScenario

    return metrics
}
