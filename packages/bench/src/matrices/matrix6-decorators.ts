import { DecoratorAdapter } from '../adapters'
import type { BenchmarkAdapter } from '../adapters/types'
import { DiverseKeysScenario, ExtremeSpamScenario } from '../scenarios'
import type { BenchmarkScenario } from '../scenarios/types'
import type { BenchMetrics } from '../types'

/**
 * Matrix 6 has two sub-sections with very different intents:
 *
 * 6.1 — Decorator on LOCAL (raw overhead reference)
 *   The decorators are designed to add value on top of remote backends. Wrapping a
 *   local limiter with a decorator is structurally pure overhead: there is no
 *   network round-trip to absorb, no failure to circuit-break, nothing to retry.
 *   This sub-section is a *reference* for the per-call cost of the decorator
 *   machinery itself. It is not a recommendation of whether to use the decorator.
 *
 * 6.2 — Decorator on REDIS (value under extreme spam)
 *   Redis is the backend where the decorators earn their cost. Under extreme spam
 *   on a single hot key, the 1000 req/60s limit is exhausted in the first ~7ms
 *   of the test; after that, every call hits Redis just to learn "denied". The
 *   `withCache` decorator absorbs those denied responses in memory and turns
 *   the limiter into a local-memory operation for the rest of the run. The
 *   `withCircuitBreaker` and `withRetry` decorators earn their cost only when
 *   the backend is failing, which is not part of this matrix.
 */
export async function runMatrix6(
    runHarness: (adapter: BenchmarkAdapter, scenario: BenchmarkScenario) => Promise<BenchMetrics>
): Promise<BenchMetrics[]> {
    console.log(`\nRunning Matrix 6: Decorator Performance & Resilience Influence...`)
    console.log(`  6.1 — Decorator on LOCAL (raw overhead reference)`)
    console.log(`  6.2 — Decorator on REDIS (value under extreme spam)`)

    const diverseScenario = new DiverseKeysScenario()
    const spamScenario = new ExtremeSpamScenario()
    const metrics: BenchMetrics[] = []

    // ─── 6.1 Decorator on LOCAL ────────────────────────────────────────────────
    // The decorators here are *all* overhead: no remote backend to protect.
    // Kept as a reference for the per-call cost of the decorator machinery.
    const localAdapters = [
        new DecoratorAdapter('Raw Fixed Window (local)', 'none', { backend: 'local' }),
        new DecoratorAdapter('+ withCache (local)', 'cache', { backend: 'local' }),
        new DecoratorAdapter('+ withCircuitBreaker (local)', 'circuitbreaker', {
            backend: 'local',
        }),
        new DecoratorAdapter('+ withFallback (local)', 'fallback', { backend: 'local' }),
        new DecoratorAdapter('+ withRetry (local)', 'retry', { backend: 'local' }),
    ]

    for (const adapter of localAdapters) {
        try {
            await adapter.initialize()
            metrics.push(await runHarness(adapter, diverseScenario))
        } finally {
            await adapter.destroy()
        }
    }

    // ─── 6.2 Decorator on REDIS under extreme spam ────────────────────────────
    // The point of this section is to show that `withCache` on a remote backend
    // does what the local-overhead reference hides: it turns the post-exhaustion
    // portion of the run (where every call is denied) into a local-memory lookup.
    const redisAdapters = [
        new DecoratorAdapter('Raw Redis Fixed Window', 'none', {
            backend: 'redis',
            strategy: 'fixed-window',
        }),
        new DecoratorAdapter('Redis + withCache', 'cache', {
            backend: 'redis',
            strategy: 'fixed-window',
        }),
        new DecoratorAdapter('Redis + withCircuitBreaker', 'circuitbreaker', {
            backend: 'redis',
            strategy: 'fixed-window',
        }),
        new DecoratorAdapter('Redis + withRetry', 'retry', {
            backend: 'redis',
            strategy: 'fixed-window',
        }),
    ]

    for (const adapter of redisAdapters) {
        try {
            await adapter.initialize()
            metrics.push(await runHarness(adapter, spamScenario))
        } finally {
            await adapter.destroy()
        }
    }

    return metrics
}
