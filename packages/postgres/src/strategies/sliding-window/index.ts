import {
    type Limiter,
    type SlidingWindowOptions,
    type SlidingWindowResult,
    validateSlidingWindowOptions,
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

export type SlidingWindowLimiterConfig = SlidingWindowOptions & PostgresLimiterBaseConfig

export async function slidingWindow(
    config: SlidingWindowLimiterConfig
): Promise<Limiter<SlidingWindowResult>> {
    validateSlidingWindowOptions(config)
    const { limit, windowMs, prefix = 'sw', skipMigrations = false } = config
    const conn = await detectAndCreate(config)

    if (!skipMigrations && conn.driver) {
        await runMigrations(conn.driver, { unlogged: config.unlogged })
    }
    const cleanupHandle = conn.driver ? startAutoCleanup(conn.driver, windowMs) : null

    let limiter: Limiter<SlidingWindowResult>

    if (conn.mode === 'postgres') {
        limiter = {
            check: createPostgresCheck(conn.sql, prefix, windowMs, limit),
            checkBatch: createPostgresCheckBatch(conn.sql, prefix, windowMs, limit),
            async destroy() {
                cleanupHandle?.stop()
                await conn.end()
            },
        }
    } else {
        limiter = {
            check: createPgCheck(conn.driver, prefix, windowMs, limit),
            checkBatch: createPgCheckBatch(conn.driver, prefix, windowMs, limit),
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
