import { config } from '../config'
import type { BenchmarkAdapter } from './types'

export class RlfPostgresAdapter implements BenchmarkAdapter {
    name = 'rate-limiter-flexible Postgres'
    private pool: any
    private limiter: any

    async initialize(): Promise<void> {
        const { default: pg } = await import('pg')

        // Clean up table first to ensure isolated state
        const poolForCleanup = new pg.Pool({
            connectionString: config.postgresUrl,
            max: 1,
            connectionTimeoutMillis: 1000,
        })
        try {
            await poolForCleanup.query('DROP TABLE IF EXISTS rlfl_postgres_fixed CASCADE')
        } catch {
            // Ignore
        } finally {
            await poolForCleanup.end()
        }

        // Connect actual benchmarking pool
        this.pool = new pg.Pool({
            connectionString: config.postgresUrl,
            max: config.benchConcurrency,
            connectionTimeoutMillis: 1000,
        })

        // Verify database is online
        try {
            await this.pool.query('SELECT 1')
        } catch (err: any) {
            throw new Error(`Database connection failed: ${err.message}`, { cause: err })
        }

        const { RateLimiterPostgres } = await import('rate-limiter-flexible')

        this.limiter = await new Promise<any>((resolve, reject) => {
            const limiterInstance = new RateLimiterPostgres(
                {
                    storeClient: this.pool,
                    points: config.limit,
                    duration: config.windowMs / 1000,
                    tableName: 'rlfl_postgres_fixed',
                },
                err => {
                    if (err) reject(err)
                    else resolve(limiterInstance)
                }
            )
        })

        if (config.benchUnlogged) {
            try {
                await this.pool.query('ALTER TABLE rlfl_postgres_fixed SET UNLOGGED')
            } catch {
                // Ignore if not supported/fails
            }
        }
    }

    async check(key: string | string[]): Promise<{ allowed: boolean }> {
        const keys = Array.isArray(key) ? key : [key]
        const results = await Promise.all(
            keys.map(async k => {
                try {
                    await this.limiter.consume(k, 1)
                    return true
                } catch {
                    return false
                }
            })
        )
        return { allowed: results.every(Boolean) }
    }

    async destroy(): Promise<void> {
        if (this.pool) {
            await this.pool.end()
        }
    }
}
