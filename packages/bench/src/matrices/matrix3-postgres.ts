import { PostgresAdapter } from '../adapters'
import type { BenchmarkAdapter } from '../adapters/types'
import { DiverseKeysScenario, ExtremeSpamScenario } from '../scenarios'
import type { BenchmarkScenario } from '../scenarios/types'
import type { BenchMetrics } from '../types'

export async function runMatrix3(
    runHarness: (adapter: BenchmarkAdapter, scenario: BenchmarkScenario) => Promise<BenchMetrics>
): Promise<BenchMetrics[]> {
    console.log(`\nRunning Matrix 3: Postgres strategy comparison (using node-postgres)...`)

    const adapters = [
        new PostgresAdapter({
            name: 'Postgres Fixed Window',
            strategy: 'fixed-window',
            driverType: 'pg',
            unlogged: true,
            skipMigrations: false,
        }),
        new PostgresAdapter({
            name: 'Postgres Sliding Window',
            strategy: 'sliding-window',
            driverType: 'pg',
            unlogged: true,
            skipMigrations: false,
        }),
        new PostgresAdapter({
            name: 'Postgres Token Bucket',
            strategy: 'token-bucket',
            driverType: 'pg',
            unlogged: true,
            skipMigrations: false,
        }),
        new PostgresAdapter({
            name: 'Postgres Indiv Fixed Window',
            strategy: 'individual-fixed-window',
            driverType: 'pg',
            unlogged: true,
            skipMigrations: false,
        }),
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
                `  ⚠️ Postgres diverse lookup benchmark skipped for ${adapter.name}: ${e.message}`
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
            console.log(`  ⚠️ Postgres spam benchmark skipped for ${adapter.name}: ${e.message}`)
        } finally {
            await adapter.destroy()
        }
    }

    return metrics
}
