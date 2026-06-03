import { PostgresAdapter, RedisAdapter } from '../adapters'
import type { BenchmarkAdapter } from '../adapters/types'
import { config } from '../config'
import { DiverseKeysScenario, ExtremeSpamScenario } from '../scenarios'
import type { BenchmarkScenario } from '../scenarios/types'
import type { BenchMetrics } from '../types'

export async function runMatrix5(
    runHarness: (adapter: BenchmarkAdapter, scenario: BenchmarkScenario) => Promise<BenchMetrics>
): Promise<BenchMetrics[]> {
    console.log(`\nRunning Matrix 5: Driver & Engine Battle...`)

    const diverseScenario = new DiverseKeysScenario()
    const spamScenario = new ExtremeSpamScenario()
    const metrics: BenchMetrics[] = []

    // 1. Valkey vs Redis 7
    try {
        const redisNode = new RedisAdapter({
            name: 'Redis 8 (node-redis client)',
            strategy: 'fixed-window',
            clientType: 'redis',
            url: config.redisUrl,
        })
        const redisIo = new RedisAdapter({
            name: 'Redis 8 (ioredis client)',
            strategy: 'fixed-window',
            clientType: 'ioredis',
            url: config.redisUrl,
        })
        const valkeyNode = new RedisAdapter({
            name: 'Valkey 8 (node-redis client)',
            strategy: 'fixed-window',
            clientType: 'redis',
            url: config.valkeyUrl,
        })
        const valkeyIo = new RedisAdapter({
            name: 'Valkey 8 (ioredis client)',
            strategy: 'fixed-window',
            clientType: 'ioredis',
            url: config.valkeyUrl,
        })

        for (const adapter of [redisNode, redisIo, valkeyNode, valkeyIo]) {
            try {
                await adapter.initialize()
                metrics.push(await runHarness(adapter, spamScenario))
            } catch (e: any) {
                console.log(
                    `  ⚠️ Redis/Valkey client drivers battle skipped for ${adapter.name}: ${e.message}`
                )
            } finally {
                await adapter.destroy()
            }
        }
    } catch (e: any) {
        console.log(`  ⚠️ Matrix 5: Redis client drivers battle skipped: ${e.message}`)
    }

    // 2. pg vs postgres.js
    // Note: postgres.js uses sql.unsafe() in the RateLock driver, which
    // requires max: 1 OR being inside a sql.begin() transaction. We pass
    // poolMax: 1 here to make the bench work. The trade-off: postgres.js
    // is benchmarked with a single connection (no pool parallelism). A
    // true apples-to-apples comparison would require a dedicated driver
    // using tagged templates, which is a separate refactor.
    try {
        const pgjsFixed = new PostgresAdapter({
            name: 'Postgres.js - Fixed Window',
            strategy: 'fixed-window',
            driverType: 'postgres',
            unlogged: true,
            skipMigrations: false,
            poolMax: 1,
        })
        const pgNodeFixedLogged = new PostgresAdapter({
            name: 'node-postgres - Fixed Window (Logged)',
            strategy: 'fixed-window',
            driverType: 'pg',
            unlogged: false,
            skipMigrations: false,
        })
        const pgNodeFixedUnlogged = new PostgresAdapter({
            name: 'node-postgres - Fixed Window (Unlogged)',
            strategy: 'fixed-window',
            driverType: 'pg',
            unlogged: true,
            skipMigrations: false,
        })
        const pgjsToken = new PostgresAdapter({
            name: 'Postgres.js - Token Bucket',
            strategy: 'token-bucket',
            driverType: 'postgres',
            unlogged: true,
            skipMigrations: false,
            poolMax: 1,
        })
        const pgNodeToken = new PostgresAdapter({
            name: 'node-postgres - Token Bucket',
            strategy: 'token-bucket',
            driverType: 'pg',
            unlogged: true,
            skipMigrations: false,
        })

        // Diverse scenarios
        for (const adapter of [
            pgjsFixed,
            pgNodeFixedLogged,
            pgNodeFixedUnlogged,
            pgjsToken,
            pgNodeToken,
        ]) {
            try {
                await adapter.initialize()
                metrics.push(await runHarness(adapter, diverseScenario))
            } catch (e: any) {
                console.log(
                    `  ⚠️ pg vs postgres.js diverse lookup skipped for ${adapter.name}: ${e.message}`
                )
            } finally {
                await adapter.destroy()
            }
        }

        // Spam scenarios
        for (const adapter of [pgjsToken, pgNodeToken]) {
            try {
                await adapter.initialize()
                metrics.push(await runHarness(adapter, spamScenario))
            } catch (e: any) {
                console.log(`  ⚠️ pg vs postgres.js spam skipped for ${adapter.name}: ${e.message}`)
            } finally {
                await adapter.destroy()
            }
        }
    } catch (e: any) {
        console.log(`  ⚠️ pg vs postgres.js benchmark skipped: ${e.message}`)
    }

    return metrics
}
