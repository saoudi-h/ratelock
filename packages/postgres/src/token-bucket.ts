import {
  type CacheConfig,
  type CircuitBreakerConfig,
  type ErrorPolicy,
  type Limiter,
  type RetryConfig,
  type TokenBucketOptions,
  type TokenBucketResult,
  withCache,
  withCircuitBreaker,
  withErrorPolicy,
  withRetry,
} from '@ratelock/core'
import { createConnection } from './drivers'
import { runMigrations } from './migrations'

const TABLE = 'ratelock.token_bucket'

export type TokenBucketLimiterConfig = TokenBucketOptions & {
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

export async function createTokenBucketLimiter(
  config: TokenBucketLimiterConfig,
): Promise<Limiter<TokenBucketResult>> {
  const { capacity, refillRate, prefix = 'tb', skipMigrations = false } = config
  const conn = await createConnection(config)
  const drv = conn.driver

  if (!skipMigrations) await runMigrations(drv)

  let limiter: Limiter<TokenBucketResult> = {
    async check(id: string): Promise<TokenBucketResult> {
      const key = `${prefix}:${id}`
      const now = Date.now()

      // Step 1: Try UPDATE (only if refilled tokens >= 1)
      type Row = { tokens: number }
      const updateRows = await drv.query<Row>(
        `UPDATE ${TABLE} SET
           tokens = GREATEST(0,
             ${TABLE}.tokens + EXTRACT(EPOCH FROM NOW() - ${TABLE}.last_refill) * ${TABLE}.refill_rate - 1
           ),
           last_refill = NOW(),
           expires_at = NOW() + '1 hour'::interval
         WHERE key = $1
           AND ${TABLE}.tokens + EXTRACT(EPOCH FROM NOW() - ${TABLE}.last_refill) * ${TABLE}.refill_rate >= 1
         RETURNING tokens`,
        [key],
      )

      if (updateRows.length > 0) {
        const tokens = updateRows[0]!.tokens
        return {
          allowed: true,
          remaining: Math.floor(tokens),
          tokens: Math.floor(tokens),
          refillTime: 0,
        }
      }

      // Step 2: Try INSERT (new key)
      const insertRows = await drv.query<Row>(
        `INSERT INTO ${TABLE} (key, tokens, last_refill, capacity, refill_rate, expires_at)
         VALUES ($1, $2, NOW(), $2, $3, NOW() + '1 hour'::interval)
         ON CONFLICT (key) DO NOTHING
         RETURNING tokens`,
        [key, capacity, refillRate],
      )

      if (insertRows.length > 0) {
        return {
          allowed: true,
          remaining: Math.floor(insertRows[0]!.tokens),
          tokens: Math.floor(insertRows[0]!.tokens),
          refillTime: 0,
        }
      }

      // Step 3: Key exists but no tokens available
      return {
        allowed: false,
        remaining: 0,
        tokens: 0,
        refillTime: Math.ceil(1 / refillRate * 1000),
      }
    },

    async checkBatch(ids: string[]): Promise<TokenBucketResult[]> {
      return Promise.all(ids.map((id) => this.check(id)))
    },
  }

  if (config.cache) limiter = withCache(limiter, config.cache)
  if (config.retry) limiter = withRetry(limiter, config.retry)
  if (config.circuitBreaker) limiter = withCircuitBreaker(limiter, config.circuitBreaker)
  if (config.errorPolicy) limiter = withErrorPolicy(limiter, config.errorPolicy)

  return limiter
}
