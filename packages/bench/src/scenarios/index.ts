import { createFixedWindowLimiter as createLocalFixed } from '@ratelock/local'
import { createSlidingWindowLimiter as createLocalSliding } from '@ratelock/local'
import { createTokenBucketLimiter as createLocalToken } from '@ratelock/local'
import { createIndividualFixedWindowLimiter as createLocalIndividual } from '@ratelock/local'
import type { ScenarioConfig } from '../types'
import type { Limiter } from '@ratelock/core'

export async function createScenarioChecker(
  config: ScenarioConfig,
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
      limiter = await createLocalToken({ capacity: config.limit, refillRate: 1000, ...opts } as any)
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

  // @ts-ignore — optional peer dep
  const mod = await import('redis')
  const client = mod.createClient({ url })
  await client.connect()

  const { createFixedWindowLimiter: createRedisFixed } = await import('@ratelock/redis')
  const { createSlidingWindowLimiter: createRedisSliding } = await import('@ratelock/redis')
  const { createTokenBucketLimiter: createRedisToken } = await import('@ratelock/redis')
  const { createIndividualFixedWindowLimiter: createRedisIndividual } = await import('@ratelock/redis')

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
      limiter = await createRedisToken({ client, capacity: config.limit, refillRate: 1000, cache: config.cache } as any)
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

  // @ts-ignore — optional peer dep
  const mod = await import('postgres')
  const sql = mod.default(url)
  await sql`SELECT 1`

  const { createFixedWindowLimiter: createPgFixed } = await import('@ratelock/postgres')
  const { createSlidingWindowLimiter: createPgSliding } = await import('@ratelock/postgres')
  const { createTokenBucketLimiter: createPgToken } = await import('@ratelock/postgres')
  const { createIndividualFixedWindowLimiter: createPgIndividual } = await import('@ratelock/postgres')

  const opts = { sql, limit: config.limit, windowMs: config.windowMs, cache: config.cache, skipMigrations: true }
  let limiter: Limiter<any>

  switch (config.strategy) {
    case 'fixed-window':
      limiter = await createPgFixed(opts as any)
      break
    case 'sliding-window':
      limiter = await createPgSliding(opts as any)
      break
    case 'token-bucket':
      limiter = await createPgToken({ sql, capacity: config.limit, refillRate: 1000, cache: config.cache, skipMigrations: true } as any)
      break
    case 'individual-fixed-window':
      limiter = await createPgIndividual(opts as any)
      break
  }

  return (id: string) => limiter.check(id)
}
