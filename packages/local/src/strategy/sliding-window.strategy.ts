import type { Storage } from '@ratelock/core/storage'
import type { Limited, SlidingWindow } from '@ratelock/core/strategy'
import { Strategy } from '@ratelock/core/strategy'

export interface SlidingWindowStrategyOptions {
    limit: number
    windowMs: number
    precision?: number 
}

export class SlidingWindowStrategy
    extends Strategy<SlidingWindowStrategy>
    implements SlidingWindow, Limited
{
    private readonly precision: number
    constructor(
        private storage: Storage,
        private options: SlidingWindowStrategyOptions
    ) {
        super()
        
        this.precision = options.precision ?? Math.max(100, Math.floor(options.windowMs / 10))
    }

    getWindowMs(): number {
        return this.options.windowMs
    }
    getLimit(): number {
        return this.options.limit
    }

    getPrecision(): number {
        return this.precision
    }

    async check(identifier: string) {
        const now = Date.now()
        const { windowMs, limit } = this.options

        
        await this.storage.cleanupTimestamps(identifier)

        
        const currentCount = await this.storage.countTimestamps(identifier, windowMs)

        
        const allowed = currentCount < limit

        
        if (allowed) {
            
            const ttlMs = windowMs + this.precision
            await this.storage.addTimestamp(identifier, now, ttlMs)
        }

        const remaining = Math.max(0, limit - (allowed ? currentCount + 1 : currentCount))
        
        const oldestTimestamp = await this.storage.getOldestTimestamp(identifier)
        const reset = oldestTimestamp ? oldestTimestamp + windowMs : now + windowMs
        const oldestRequest = oldestTimestamp ?? now
        return {
            allowed,
            remaining,
            reset,
            oldestRequest,
        }
    }
}

export class OptimizedSlidingWindowStrategy
    extends Strategy<OptimizedSlidingWindowStrategy>
    implements SlidingWindow, Limited
{
    private readonly subWindowMs: number
    private readonly subWindowCount: number
    constructor(
        private storage: Storage,
        private options: SlidingWindowStrategyOptions
    ) {
        super()

        
        this.subWindowMs = options.precision ?? Math.max(1000, Math.floor(options.windowMs / 10))
        this.subWindowCount = Math.ceil(options.windowMs / this.subWindowMs)
    }

    getWindowMs(): number {
        return this.options.windowMs
    }

    getLimit(): number {
        return this.options.limit
    }

    getPrecision(): number {
        return this.subWindowMs
    }

    async check(identifier: string) {
        const now = Date.now()
        const { limit } = this.options

        
        const currentSubWindow = Math.floor(now / this.subWindowMs)
        const oldestSubWindow = currentSubWindow - this.subWindowCount + 1

        
        let totalCount = 0
        const pipeline = this.storage.pipeline()

        for (let i = oldestSubWindow; i <= currentSubWindow; i++) {
            const subWindowKey = `${identifier}:sw:${i}`
            await pipeline.get(subWindowKey)
        }

        const results = await pipeline.exec()
        for (const result of results) {
            if (result) {
                totalCount += parseInt(result as string, 10)
            }
        }

        
        const allowed = totalCount < limit

        
        if (allowed) {
            const currentSubWindowKey = `${identifier}:sw:${currentSubWindow}`
            const ttlMs = this.subWindowMs * this.subWindowCount + 1000 
            await this.storage.increment(currentSubWindowKey, ttlMs)
        }

        const remaining = Math.max(0, limit - (allowed ? totalCount + 1 : totalCount))
        const reset = (oldestSubWindow + this.subWindowCount) * this.subWindowMs
        const oldestRequest = oldestSubWindow * this.subWindowMs

        return {
            allowed,
            remaining,
            reset,
            oldestRequest,
        }
    }
}

export function createSlidingWindowStrategy(options: SlidingWindowStrategyOptions) {
    return (context: { storage: Storage }) => {
        return new SlidingWindowStrategy(context.storage, options)
    }
}

export function createOptimizedSlidingWindowStrategy(options: SlidingWindowStrategyOptions) {
    return (context: { storage: Storage }) => {
        return new OptimizedSlidingWindowStrategy(context.storage, options)
    }
}
