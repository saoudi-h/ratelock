import {
  type CacheConfig,
  type CircuitBreakerConfig,
  type ErrorPolicy,
  type FixedWindowResult,
  type IndividualFixedWindowOptions,
  type Limiter,
  type RetryConfig,
  withCache,
  withCircuitBreaker,
  withErrorPolicy,
  withRetry,
} from '@ratelock/core'
import { createConnection } from './drivers'
import { runMigrations } from './migrations'

const TABLE = 'ratelock.individual_fixed_window'

export type IndividualFixedWindowLimiterConfig = IndividualFixedWindowOptions & {
  sql?: unknown
  pool?: unknown
  connectionString?: string
  driver?: 'postgres' | 'pg'
  skipMigrations?: boolean
  prefix?: string
  cache?: CacheConfig
  retry?: RetryConfig
  circuitBreaker?: CircuitBreakerConfig
  errorPolicy?: ErrorPolicy
}

export async function createIndividualFixedWindowLimiter(
  config: IndividualFixedWindowLimiterConfig,
): Promise<Limiter<FixedWindowResult>> {
  const { limit, windowMs, prefix = 'ifw', skipMigrations = false } = config
  const conn = await createConnection(config)
  const drv = conn.driver

  if (!skipMigrations) await runMigrations(drv)

  let limiter: Limiter<FixedWindowResult> = {
    async check(id: string): Promise<FixedWindowResult> {
      const key = `${prefix}:${id}`

      type Row = { count: number; window_start: string; expires_at: string }

      const rows = await drv.query<Row>(
        `INSERT INTO ${TABLE} (key, count, window_start, expires_at)
         VALUES ($1, 1, NOW(), NOW() + $2::interval)
         ON CONFLICT (key) DO UPDATE SET
           window_start = CASE
             WHEN ${TABLE}.window_start < NOW() - $2::interval
             THEN NOW() ELSE ${TABLE}.window_start
           END,
           count = CASE
             WHEN ${TABLE}.window_start < NOW() - $2::interval
             THEN 1
             ELSE ${TABLE}.count + 1
           END,
           expires_at = CASE
             WHEN ${TABLE}.window_start < NOW() - $2::interval
             THEN NOW() + $2::interval
             ELSE ${TABLE}.expires_at
           END
         RETURNING count, window_start, expires_at`,
        [key, `${windowMs} milliseconds`],
      )

      const row = rows[0]!
      const count = row.count
      const windowStart = new Date(row.window_start).getTime()

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        reset: windowStart + windowMs,
      }
    },

    async checkBatch(ids: string[]): Promise<FixedWindowResult[]> {
      return Promise.all(ids.map((id) => this.check(id)))
    },
  }

  if (config.cache) limiter = withCache(limiter, config.cache)
  if (config.retry) limiter = withRetry(limiter, config.retry)
  if (config.circuitBreaker) limiter = withCircuitBreaker(limiter, config.circuitBreaker)
  if (config.errorPolicy) limiter = withErrorPolicy(limiter, config.errorPolicy)

  return limiter
}
