import {
    LocalFixedAdapter,
    PostgresAdapter,
    RedisAdapter,
    RlfMemoryAdapter,
    RlfPostgresAdapter,
    RlfRedisAdapter,
} from '../adapters'
import type { BenchmarkAdapter } from '../adapters/types'
import { ExtremeSpamScenario } from '../scenarios'
import type { BenchmarkScenario } from '../scenarios/types'
import type { BenchMetrics } from '../types'

export async function runMatrix4(
    runHarness: (adapter: BenchmarkAdapter, scenario: BenchmarkScenario) => Promise<BenchMetrics>
): Promise<BenchMetrics[]> {
    console.log(`\nRunning Matrix 4: RateLock vs rate-limiter-flexible...`)

    const spamScenario = new ExtremeSpamScenario()
    const metrics: BenchMetrics[] = []

    // 1. Local Memory comparison
    try {
        const rlLocal = new LocalFixedAdapter('RateLock Local Fixed Window')
        const rlfLocal = new RlfMemoryAdapter()

        for (const adapter of [rlLocal, rlfLocal]) {
            await adapter.initialize()
            try {
                metrics.push(await runHarness(adapter, spamScenario))
            } finally {
                await adapter.destroy()
            }
        }
    } catch (e: any) {
        console.log(`  ⚠️ Memory comparison failed: ${e.message}`)
    }

    // 2. Redis comparison
    try {
        const rlRedis = new RedisAdapter({
            name: 'RateLock Redis Fixed Window',
            strategy: 'fixed-window',
        })
        const rlfRedis = new RlfRedisAdapter()

        for (const adapter of [rlRedis, rlfRedis]) {
            await adapter.initialize()
            try {
                metrics.push(await runHarness(adapter, spamScenario))
            } finally {
                await adapter.destroy()
            }
        }
    } catch (e: any) {
        console.log(`  ⚠️ Redis RLF Comparison skipped: ${e.message}`)
    }

    // 3. Postgres comparison
    try {
        const rlPostgres = new PostgresAdapter({
            name: 'RateLock Postgres Fixed Window',
            strategy: 'fixed-window',
            driverType: 'pg',
            unlogged: true,
            skipMigrations: true,
        })
        const rlfPostgres = new RlfPostgresAdapter()

        for (const adapter of [rlPostgres, rlfPostgres]) {
            await adapter.initialize()
            try {
                metrics.push(await runHarness(adapter, spamScenario))
            } finally {
                await adapter.destroy()
            }
        }
    } catch (e: any) {
        console.log(`  ⚠️ Postgres RLF Comparison skipped: ${e.message}`)
    }

    return metrics
}
