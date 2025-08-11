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

export interface IndividualFixedWindowOptions extends BaseStrategyOptions {
    limit: number
    windowMs: number
}

export const individualFixedWindowValidator: StrategyValidator<IndividualFixedWindowOptions> = {
    validate(options) {
        if (options.limit <= 0) throw new Error('limit must be positive')
        if (options.windowMs <= 0) throw new Error('windowMs must be positive')
    },
    normalize(options) {
        return {
            ...options,
            prefix: options.prefix ?? 'ifw',
            enableStats: options.enableStats ?? false,
            cleanupInterval: options.cleanupInterval ?? 60_000,
        }
    },
}

export class IndividualFixedWindowStrategy extends Strategy<
    WindowedLimited,
    IndividualFixedWindowOptions
> {
    readonly metadata: StrategyMetadata = {
        name: 'individual-fixed-window',
        version: '1.0.0',
        memoryEfficient: true,
        supportsBatch: true,
    }

    override async check(identifier: string): Promise<InferStrategyResult<WindowedLimited>> {
        const now = Date.now()
        const { limit, windowMs, prefix = 'ifw' } = this.options

        // Get or create the window start time for this identifier
        const windowStartKey = `${prefix}:${identifier}:start`
        let windowStart = await this.storage.get(windowStartKey)

        if (!windowStart) {
            // First request for this identifier, start a new window
            windowStart = now.toString()
            await this.storage.set(windowStartKey, windowStart, windowMs)
        } else {
            const startTime = parseInt(windowStart, 10)
            const windowEnd = startTime + windowMs

            if (now >= windowEnd) {
                // Window expired, start a new one
                windowStart = now.toString()
                await this.storage.set(windowStartKey, windowStart, windowMs)
            }
        }

        const startTime = parseInt(windowStart, 10)
        const windowEnd = startTime + windowMs
        const ttlMs = Math.max(1, windowEnd - now)

        // Count requests in current window
        const countKey = `${prefix}:${identifier}:count`
        const currentCount = await this.storage.increment(countKey, ttlMs)
        const allowed = currentCount <= limit

        if (!allowed && currentCount > limit) {
            // Rollback the increment
            const currentValue = await this.storage.get(countKey)
            if (currentValue) {
                const decremented = Math.max(0, parseInt(currentValue, 10) - 1)
                await this.storage.set(countKey, decremented.toString(), ttlMs)
            }
        }

        const usedCount = allowed ? currentCount : limit
        const remaining = Math.max(0, limit - usedCount)

        return {
            allowed,
            remaining,
            reset: windowEnd,
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

export const createIndividualFixedWindowStrategy = createStrategyFactory<
    IndividualFixedWindowStrategy,
    IndividualFixedWindowOptions
>(
    individualFixedWindowValidator,
    (storage, options) => new IndividualFixedWindowStrategy(storage, options)
)

export const createIndividualFixedWindowStrategyWithContext: StrategyFactory<
    IndividualFixedWindowStrategy,
    IndividualFixedWindowOptions
> = options => (context: StrategyContext) =>
    createIndividualFixedWindowStrategy(context.storage, options)

StrategyRegistry.register('individual-fixed-window', createIndividualFixedWindowStrategyWithContext)

export const IndividualFixedWindow = createStrategy<
    IndividualFixedWindowStrategy,
    IndividualFixedWindowOptions
>(createIndividualFixedWindowStrategyWithContext)
