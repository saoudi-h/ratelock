import {
    fixedWindow,
    individualFixedWindow,
    slidingWindow,
    tokenBucket,
    type FixedWindowResult,
    type Limiter,
    type SlidingWindowResult,
    type TokenBucketResult,
} from '@ratelock/local'
import type {
    FixedWindowConfig,
    IndividualFixedWindowConfig,
    SlidingWindowConfig,
    StrategyId,
    StrategySpecificConfig,
    TokenBucketConfig,
} from './types'

type AnyResult = FixedWindowResult | SlidingWindowResult | TokenBucketResult
type AnyLimiter = Limiter<AnyResult>

const limiterCache = new Map<StrategyId, AnyLimiter>()
const limiterConfigCache = new Map<StrategyId, string>()

function serializeConfig(config: StrategySpecificConfig) {
    return JSON.stringify(config)
}

async function createLimiter(
    strategyId: StrategyId,
    config: StrategySpecificConfig
): Promise<AnyLimiter> {
    switch (strategyId) {
        case 'fixed-window': {
            const c = config as FixedWindowConfig
            return fixedWindow({ limit: c.limit, windowMs: c.windowMs })
        }
        case 'sliding-window': {
            const c = config as SlidingWindowConfig
            return slidingWindow({ limit: c.limit, windowMs: c.windowMs })
        }
        case 'token-bucket': {
            const c = config as TokenBucketConfig
            return tokenBucket({ capacity: c.capacity, refillRate: c.refillRate })
        }
        case 'individual-fixed-window': {
            const c = config as IndividualFixedWindowConfig
            return individualFixedWindow({ limit: c.limit, windowMs: c.windowMs })
        }
    }
}

export async function getLimiter(
    strategyId: StrategyId,
    config: StrategySpecificConfig
): Promise<AnyLimiter> {
    const cached = limiterCache.get(strategyId)
    const nextConfigKey = serializeConfig(config)
    const cachedConfigKey = limiterConfigCache.get(strategyId)
    if (cached && cachedConfigKey === nextConfigKey) return cached

    if (cached) {
        await destroyLimiter(strategyId)
    }

    const limiter = await createLimiter(strategyId, config)
    limiterCache.set(strategyId, limiter)
    limiterConfigCache.set(strategyId, nextConfigKey)
    return limiter
}

export async function destroyLimiter(strategyId: StrategyId): Promise<void> {
    const limiter = limiterCache.get(strategyId)
    if (limiter?.destroy) {
        await limiter.destroy()
    }
    limiterCache.delete(strategyId)
    limiterConfigCache.delete(strategyId)
}

export async function destroyAllLimiters(): Promise<void> {
    const promises = Array.from(limiterCache.keys()).map(id => destroyLimiter(id))
    await Promise.all(promises)
}

export async function checkRateLimit(
    strategyId: StrategyId,
    config: StrategySpecificConfig,
    key: string
): Promise<AnyResult> {
    const limiter = await getLimiter(strategyId, config)
    return limiter.check(key)
}
