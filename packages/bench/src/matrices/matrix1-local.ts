import {
    LocalFixedAdapter,
    LocalIndividualAdapter,
    LocalSlidingAdapter,
    LocalTokenAdapter,
} from '../adapters'
import type { BenchmarkAdapter } from '../adapters/types'
import { DiverseKeysScenario, ExtremeSpamScenario } from '../scenarios'
import type { BenchmarkScenario } from '../scenarios/types'
import type { BenchMetrics } from '../types'

export async function runMatrix1(
    runHarness: (adapter: BenchmarkAdapter, scenario: BenchmarkScenario) => Promise<BenchMetrics>
): Promise<BenchMetrics[]> {
    console.log(`Running Matrix 1: Local memory algorithms...`)

    const adapters = [
        new LocalFixedAdapter(),
        new LocalSlidingAdapter(),
        new LocalTokenAdapter(),
        new LocalIndividualAdapter(),
    ]

    const diverseScenario = new DiverseKeysScenario()
    const spamScenario = new ExtremeSpamScenario()
    const metrics: BenchMetrics[] = []

    // Diverse Keys
    for (const adapter of adapters) {
        await adapter.initialize()
        try {
            metrics.push(await runHarness(adapter, diverseScenario))
        } finally {
            await adapter.destroy()
        }
    }

    // Extreme Spam
    for (const adapter of adapters) {
        await adapter.initialize()
        try {
            metrics.push(await runHarness(adapter, spamScenario))
        } finally {
            await adapter.destroy()
        }
    }

    return metrics
}
