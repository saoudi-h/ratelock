import { config } from '../config'
import type { BenchmarkAdapter } from './types'

export type PostgresStrategy =
    | 'fixed-window'
    | 'sliding-window'
    | 'token-bucket'
    | 'individual-fixed-window'

export type PostgresDriverType = 'pg' | 'postgres'

export class PostgresAdapter implements BenchmarkAdapter {
    public readonly name: string
    private readonly strategy: PostgresStrategy
    private readonly driverType: PostgresDriverType
    private readonly unlogged: boolean
    private readonly skipMigrations: boolean

    private pgPool: any
    private sqlClient: any
    private limiter: any

    constructor(options: {
        name: string
        strategy: PostgresStrategy
        driverType?: PostgresDriverType
        unlogged?: boolean
        skipMigrations?: boolean
    }) {
        this.name = options.name
        this.strategy = options.strategy
        this.driverType = options.driverType ?? 'pg'
        this.unlogged = options.unlogged ?? config.benchUnlogged
        this.skipMigrations = options.skipMigrations ?? false
    }

    async initialize(): Promise<void> {
        // Drop tables first to clean up existing state
        if (this.driverType === 'pg') {
            const { default: pg } = await import('pg')
            // Temporarily connect to run drop queries
            const poolForCleanup = new pg.Pool({
                connectionString: config.postgresUrl,
                max: 1,
                connectionTimeoutMillis: 1000,
            })
            try {
                await poolForCleanup.query(
                    'DROP TABLE IF EXISTS ratelock.fixed_window, ratelock.sliding_window, ratelock.token_bucket, ratelock.individual_fixed_window CASCADE'
                )
            } catch {
                // Ignore if tables don't exist
            } finally {
                await poolForCleanup.end()
            }

            // Create actual pool for benchmarking
            this.pgPool = new pg.Pool({
                connectionString: config.postgresUrl,
                max: config.benchConcurrency,
                connectionTimeoutMillis: 1000,
            })
        } else {
            // postgres.js
            const { default: postgres } = await import('postgres')
            // Temporarily connect for drop queries
            const sqlForCleanup = postgres(config.postgresUrl, {
                max: 1,
                connect_timeout: 1,
                onnotice: () => {},
            })
            try {
                await sqlForCleanup`DROP TABLE IF EXISTS ratelock.fixed_window, ratelock.sliding_window, ratelock.token_bucket, ratelock.individual_fixed_window CASCADE`
            } catch {
                // Ignore if tables don't exist
            } finally {
                await sqlForCleanup.end()
            }

            // Create actual sql client for benchmarking
            this.sqlClient = postgres(config.postgresUrl, {
                max: config.benchConcurrency,
                connect_timeout: 1,
                onnotice: () => {},
            })
        }

        const { fixedWindow, slidingWindow, tokenBucket, individualFixedWindow } =
            await import('@ratelock/postgres')

        const opts: any = {
            limit: config.limit,
            windowMs: config.windowMs,
            skipMigrations: this.skipMigrations,
            unlogged: this.unlogged,
        }

        if (this.driverType === 'pg') {
            opts.pool = this.pgPool
        } else {
            opts.sql = this.sqlClient
        }

        // Verify the database is online
        try {
            if (this.driverType === 'pg') {
                await this.pgPool.query('SELECT 1')
            } else {
                await this.sqlClient`SELECT 1`
            }
        } catch (err: any) {
            throw new Error(`Database connection failed: ${err.message}`, { cause: err })
        }

        switch (this.strategy) {
            case 'fixed-window':
                this.limiter = await fixedWindow(opts)
                break
            case 'sliding-window':
                this.limiter = await slidingWindow(opts)
                break
            case 'token-bucket':
                this.limiter = await tokenBucket({
                    ...opts,
                    capacity: config.limit,
                    refillRate: config.limit / 60,
                })
                break
            case 'individual-fixed-window':
                this.limiter = await individualFixedWindow(opts)
                break
        }
    }

    async check(key: string | string[]): Promise<{ allowed: boolean }> {
        if (Array.isArray(key)) {
            const results = await Promise.all(key.map(k => this.limiter.check(k)))
            return { allowed: results.every(r => r.allowed !== false) }
        }
        const res = await this.limiter.check(key)
        return { allowed: res.allowed !== false }
    }

    async destroy(): Promise<void> {
        if (this.pgPool) {
            await this.pgPool.end()
        }
        if (this.sqlClient) {
            await this.sqlClient.end()
        }
    }
}
