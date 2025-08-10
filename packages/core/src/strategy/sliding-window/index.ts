import { Strategy } from '../abstract'
import { createStrategy } from '../builder'
import type { InferStrategyResult, SlidingWindowLimited } from '../capabilities'
import { createStrategyFactory, type StrategyValidator } from '../factory'
import { StrategyRegistry } from '../registry'
import type {
    BaseStrategyOptions,
    StrategyContext,
    StrategyMetadata,
    TypedStrategyFactory,
} from '../types'

export interface SlidingWindowOptions extends BaseStrategyOptions {
    limit: number
    windowMs: number
}

export const slidingWindowValidator: StrategyValidator<SlidingWindowOptions> = {
    validate(options) {
        if (options.limit <= 0) throw new Error('limit must be positive')
        if (options.windowMs <= 0) throw new Error('windowMs must be positive')
    },
    normalize(options) {
        return {
            ...options,
            prefix: options.prefix ?? 'sw',
            enableStats: options.enableStats ?? false,
            cleanupInterval: options.cleanupInterval ?? 60_000,
        }
    },
}

export class SlidingWindowStrategy extends Strategy<SlidingWindowLimited, SlidingWindowOptions> {
    readonly metadata: StrategyMetadata = {
        name: 'sliding-window',
        version: '1.0.0',
        memoryEfficient: false, // Uses timestamps which can grow
        supportsBatch: true,
    }

    override async check(identifier: string): Promise<InferStrategyResult<SlidingWindowLimited>> {
        const now = Date.now()
        const { limit, windowMs, prefix = 'sw' } = this.options

        // Add current timestamp
        await this.storage.addTimestamp(identifier, now, windowMs)

        // Count timestamps within the sliding window
        const count = await this.storage.countTimestamps(identifier, windowMs)
        const allowed = count <= limit

        // Get the oldest timestamp to calculate reset time
        const oldestTimestamp = await this.storage.getOldestTimestamp(identifier)
        const reset = oldestTimestamp ? oldestTimestamp + windowMs : now + windowMs

        const remaining = Math.max(0, limit - count)

        return {
            allowed,
            remaining,
            reset,
            windowStart: oldestTimestamp || now,
            windowEnd: reset,
        }
    }

    override async checkBatch(
        identifiers: string[]
    ): Promise<Array<InferStrategyResult<SlidingWindowLimited>>> {
        const results: Array<InferStrategyResult<SlidingWindowLimited>> = []
        for (const identifier of identifiers) {
            results.push(await this.check(identifier))
        }
        return results
    }

    override async cleanup(identifier: string): Promise<void> {
        await this.storage.cleanupTimestamps(identifier)
    }
}

export const createSlidingWindowStrategy = createStrategyFactory<
    SlidingWindowStrategy,
    SlidingWindowOptions
>(slidingWindowValidator, (storage, options) => new SlidingWindowStrategy(storage, options))

export const createTypedSlidingWindowStrategy: TypedStrategyFactory<
    SlidingWindowStrategy,
    SlidingWindowOptions
> = options => (context: StrategyContext) => createSlidingWindowStrategy(context.storage, options)

StrategyRegistry.register('sliding-window', createTypedSlidingWindowStrategy)

export const SlidingWindowBuilder = createStrategy<SlidingWindowStrategy, SlidingWindowOptions>(
    createTypedSlidingWindowStrategy
)
