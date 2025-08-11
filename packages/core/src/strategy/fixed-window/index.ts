import { Strategy } from '../abstract'
import { createStrategy } from '../builder'
import type { InferStrategyResult, WindowedLimited } from '../capabilities'
import { createStrategyFactory, type StrategyValidator } from '../factory'
import { StrategyRegistry } from '../registry'
import type {
    BaseStrategyOptions,
    StrategyContext,
    StrategyFactory,
    StrategyMetadata,
} from '../types'

export interface FixedWindowOptions extends BaseStrategyOptions {
    limit: number
    windowMs: number
    startTimeMs?: number
}

export const fixedWindowValidator: StrategyValidator<FixedWindowOptions> = {
    validate(options) {
        if (options.limit <= 0) throw new Error('limit must be positive')
        if (options.windowMs <= 0) throw new Error('windowMs must be positive')
        if (options.startTimeMs !== undefined && options.startTimeMs < 0)
            throw new Error('startTimeMs must be non-negative')
    },
    normalize(options) {
        return {
            ...options,
            startTimeMs: options.startTimeMs ?? 0,
            prefix: options.prefix ?? 'fw',
            enableStats: options.enableStats ?? false,
            cleanupInterval: options.cleanupInterval ?? 60_000,
        }
    },
}

export class FixedWindowStrategy extends Strategy<WindowedLimited, FixedWindowOptions> {
    readonly metadata: StrategyMetadata = {
        name: 'fixed-window',
        version: '1.0.0',
        memoryEfficient: true,
        supportsBatch: true,
    }

    override async check(identifier: string): Promise<InferStrategyResult<WindowedLimited>> {
        const now = Date.now()
        const { limit, windowMs, startTimeMs = 0, prefix = 'fw' } = this.options

        const currentWindowIndex = Math.floor((now - startTimeMs) / windowMs)
        const windowKey = `${prefix}:${identifier}:${currentWindowIndex}`

        const windowEndTime = startTimeMs + (currentWindowIndex + 1) * windowMs
        const ttlMs = Math.max(1, windowEndTime - now)

        const currentCount = await this.storage.increment(windowKey, ttlMs)
        const allowed = currentCount <= limit

        if (!allowed && currentCount > limit) {
            const currentValue = await this.storage.get(windowKey)
            if (currentValue) {
                const decremented = Math.max(0, parseInt(currentValue, 10) - 1)
                await this.storage.set(windowKey, decremented.toString(), ttlMs)
            }
        }

        const usedCount = allowed ? currentCount : limit
        const remaining = Math.max(0, limit - usedCount)

        return {
            allowed,
            remaining,
            reset: windowEndTime,
        }
    }

    override async checkBatch(
        identifiers: string[]
    ): Promise<Array<InferStrategyResult<WindowedLimited>>> {
        const results: Array<InferStrategyResult<WindowedLimited>> = []
        for (const identifier of identifiers) {
            results.push(await this.check(identifier))
        }
        return results
    }
}

export const createFixedWindowStrategy = createStrategyFactory<
    FixedWindowStrategy,
    FixedWindowOptions
>(fixedWindowValidator, (storage, options) => new FixedWindowStrategy(storage, options))

export const createFixedWindowStrategyWithContext : StrategyFactory<
    FixedWindowStrategy,
    FixedWindowOptions
> = options => (context: StrategyContext) => createFixedWindowStrategy(context.storage, options)

StrategyRegistry.register('fixed-window', createFixedWindowStrategyWithContext)

export const FixedWindow = createStrategy<FixedWindowStrategy, FixedWindowOptions>(
    createFixedWindowStrategyWithContext
)
