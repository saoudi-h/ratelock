import {
    type Limiter,
    type TokenBucketOptions,
    type TokenBucketResult,
    validateTokenBucketOptions,
    withCache,
    withCircuitBreaker,
    withFallback,
    withRetry,
} from '@ratelock/core'
import { startAutoCleanup } from '../../cleanup'
import { runMigrations } from '../../migrations'
import type { PostgresLimiterBaseConfig } from '../../types'
import { detectAndCreate } from '../shared-connection'
import { createPgCheck, createPgCheckBatch } from './pg'
import { createPostgresCheck, createPostgresCheckBatch } from './postgres'

export type TokenBucketLimiterConfig = TokenBucketOptions & PostgresLimiterBaseConfig

export async function tokenBucket(
    config: TokenBucketLimiterConfig
): Promise<Limiter<TokenBucketResult>> {
    validateTokenBucketOptions(config)
    const { capacity, refillRate, prefix = 'tb', skipMigrations = false } = config
    const conn = await detectAndCreate(config)

    if (!skipMigrations && conn.driver) {
        await runMigrations(conn.driver, { unlogged: config.unlogged })
    }
    const cleanupHandle = conn.driver ? startAutoCleanup(conn.driver) : null

    let limiter: Limiter<TokenBucketResult>

    if (conn.mode === 'postgres') {
        limiter = {
            check: createPostgresCheck(conn.sql, prefix, capacity, refillRate),
            checkBatch: createPostgresCheckBatch(conn.sql, prefix, capacity, refillRate),
            async destroy() {
                cleanupHandle?.stop()
                await conn.end()
            },
        }
    } else {
        limiter = {
            check: createPgCheck(conn.driver, prefix, capacity, refillRate),
            checkBatch: createPgCheckBatch(conn.driver, prefix, capacity, refillRate),
            async destroy() {
                cleanupHandle?.stop()
                await conn.end()
            },
        }
    }

    if (config.cache) limiter = withCache(limiter, config.cache)
    if (config.retry) limiter = withRetry(limiter, config.retry)
    if (config.circuitBreaker) limiter = withCircuitBreaker(limiter, config.circuitBreaker)
    if (config.fallback) limiter = withFallback(limiter, config.fallback)

    return limiter
}
