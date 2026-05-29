import { DecoratorAdapter } from '../adapters'
import type { BenchmarkAdapter } from '../adapters/types'
import { DiverseKeysScenario, ExtremeSpamScenario } from '../scenarios'
import type { BenchmarkScenario } from '../scenarios/types'
import type { BenchMetrics } from '../types'

export async function runMatrix6(
    runHarness: (adapter: BenchmarkAdapter, scenario: BenchmarkScenario) => Promise<BenchMetrics>
): Promise<BenchMetrics[]> {
    console.log(`\nRunning Matrix 6: Decorator Performance & Resilience Influence...`)

    const diverseScenario = new DiverseKeysScenario()
    const spamScenario = new ExtremeSpamScenario()
    const metrics: BenchMetrics[] = []

    // 1. Diverse scenarios
    const diverseAdapters = [
        new DecoratorAdapter('Raw Fixed Window', 'none'),
        new DecoratorAdapter('Fixed Window + withCache', 'cache'),
        new DecoratorAdapter('Fixed Window + withCircuitBreaker', 'circuitbreaker'),
        new DecoratorAdapter('Fixed Window + withFallback', 'fallback'),
        new DecoratorAdapter('Fixed Window + withRetry', 'retry'),
    ]

    for (const adapter of diverseAdapters) {
        await adapter.initialize()
        try {
            metrics.push(await runHarness(adapter, diverseScenario))
        } finally {
            await adapter.destroy()
        }
    }

    // 2. Spam scenarios
    const spamAdapters = [
        new DecoratorAdapter('Raw Fixed Window', 'none'),
        new DecoratorAdapter('Fixed Window + withCache', 'cache'),
    ]

    for (const adapter of spamAdapters) {
        await adapter.initialize()
        try {
            metrics.push(await runHarness(adapter, spamScenario))
        } finally {
            await adapter.destroy()
        }
    }

    return metrics
}
