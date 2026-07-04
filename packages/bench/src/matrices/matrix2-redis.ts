import { RedisAdapter } from '../adapters'
import type { BenchmarkAdapter } from '../adapters/types'
import { DiverseKeysScenario, ExtremeSpamScenario } from '../scenarios'
import type { BenchmarkScenario } from '../scenarios/types'
import type { BenchMetrics } from '../types'

export async function runMatrix2(
    runHarness: (adapter: BenchmarkAdapter, scenario: BenchmarkScenario) => Promise<BenchMetrics>
): Promise<BenchMetrics[]> {
    console.log(`\nRunning Matrix 2: Redis strategy comparison (using ioredis)...`)

    const adapters = [
        new RedisAdapter({ name: 'Redis Fixed Window', strategy: 'fixed-window' }),
        new RedisAdapter({ name: 'Redis Sliding Window', strategy: 'sliding-window' }),
        new RedisAdapter({ name: 'Redis Token Bucket', strategy: 'token-bucket' }),
        new RedisAdapter({ name: 'Redis Indiv Fixed Window', strategy: 'individual-fixed-window' }),
    ]

    const diverseScenario = new DiverseKeysScenario()
    const spamScenario = new ExtremeSpamScenario()
    const metrics: BenchMetrics[] = []

    // Diverse Keys
    for (const adapter of adapters) {
        try {
            await adapter.initialize()
            metrics.push(await runHarness(adapter, diverseScenario))
        } catch (e: any) {
            console.log(
                `  ⚠️ Redis diverse lookup benchmark skipped for ${adapter.name}: ${e.message}`
            )
        } finally {
            await adapter.destroy()
        }
    }

    // Extreme Spam
    for (const adapter of adapters) {
        try {
            await adapter.initialize()
            metrics.push(await runHarness(adapter, spamScenario))
        } catch (e: any) {
            console.log(`  ⚠️ Redis spam benchmark skipped for ${adapter.name}: ${e.message}`)
        } finally {
            await adapter.destroy()
        }
    }

    return metrics
}
