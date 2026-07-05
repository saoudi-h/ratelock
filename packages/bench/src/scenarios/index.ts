import type { Limiter } from '@ratelock/core'
import {
    fixedWindow as createLocalFixed,
    individualFixedWindow as createLocalIndividual,
    slidingWindow as createLocalSliding,
    tokenBucket as createLocalToken,
} from '@ratelock/local'
import type { ScenarioConfig } from '../types'

export * from './batch-check.scenario'
export * from './diverse-keys.scenario'
export * from './extreme-spam.scenario'
export * from './realistic-mix.scenario'
export * from './types'

export async function createScenarioChecker(
    config: ScenarioConfig
): Promise<(id: string) => Promise<unknown>> {
    switch (config.backend) {
        case 'local':
            return createLocalChecker(config)
        case 'redis':
            return createRedisChecker(config)
        case 'postgres':
            return createPostgresChecker(config)
    }
}

async function createLocalChecker(config: ScenarioConfig) {
    const opts = { limit: config.limit, windowMs: config.windowMs, cache: config.cache }
    let limiter: Limiter<any>

    switch (config.strategy) {
        case 'fixed-window':
            limiter = await createLocalFixed(opts as any)
            break
        case 'sliding-window':
            limiter = await createLocalSliding(opts as any)
            break
        case 'token-bucket':
            limiter = await createLocalToken({
                capacity: config.limit,
                refillRate: 1000,
                ...opts,
            } as any)
            break
        case 'individual-fixed-window':
            limiter = await createLocalIndividual(opts as any)
            break
    }

    return (id: string) => limiter.check(id)
}

async function createRedisChecker(config: ScenarioConfig) {
    const url = process.env.REDIS_URL
    if (!url) throw new Error('Set REDIS_URL to benchmark Redis')

    const mod = await import('redis')
    const client = mod.createClient({ url })
    await client.connect()

    const { fixedWindow: createRedisFixed } = await import('@ratelock/redis')
    const { slidingWindow: createRedisSliding } = await import('@ratelock/redis')
    const { tokenBucket: createRedisToken } = await import('@ratelock/redis')
    const { individualFixedWindow: createRedisIndividual } = await import('@ratelock/redis')

    const opts = { client, limit: config.limit, windowMs: config.windowMs, cache: config.cache }
    let limiter: Limiter<any>

    switch (config.strategy) {
        case 'fixed-window':
            limiter = await createRedisFixed(opts as any)
            break
        case 'sliding-window':
            limiter = await createRedisSliding(opts as any)
            break
        case 'token-bucket':
            limiter = await createRedisToken({
                client,
                capacity: config.limit,
                refillRate: 1000,
                cache: config.cache,
            } as any)
            break
        case 'individual-fixed-window':
            limiter = await createRedisIndividual(opts as any)
            break
    }

    return (id: string) => limiter.check(id)
}

async function createPostgresChecker(config: ScenarioConfig) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('Set DATABASE_URL to benchmark PostgreSQL')

    const mod = await import('postgres')
    const sql = mod.default(url)
    await sql`SELECT 1`

    const { fixedWindow: createPgFixed } = await import('@ratelock/postgres')
    const { slidingWindow: createPgSliding } = await import('@ratelock/postgres')
    const { tokenBucket: createPgToken } = await import('@ratelock/postgres')
    const { individualFixedWindow: createPgIndividual } = await import('@ratelock/postgres')

    const opts = {
        sql,
        limit: config.limit,
        windowMs: config.windowMs,
        cache: config.cache,
        skipMigrations: false,
    }
    let limiter: Limiter<any>

    switch (config.strategy) {
        case 'fixed-window':
            limiter = await createPgFixed(opts as any)
            break
        case 'sliding-window':
            limiter = await createPgSliding(opts as any)
            break
        case 'token-bucket':
            limiter = await createPgToken({
                sql,
                capacity: config.limit,
                refillRate: 1000,
                cache: config.cache,
                skipMigrations: false,
            } as any)
            break
        case 'individual-fixed-window':
            limiter = await createPgIndividual(opts as any)
            break
    }

    return (id: string) => limiter.check(id)
}
