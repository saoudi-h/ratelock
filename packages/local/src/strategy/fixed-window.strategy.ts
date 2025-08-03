import type { Storage } from '@ratelock/core/storage'
import type { Limited, Windowed } from '@ratelock/core/strategy'
import { Strategy } from '@ratelock/core/strategy'

export interface FixedWindowStrategyOptions {
    limit: number
    windowMs: number
    startTimeMs?: number
}

export class FixedWindowStrategy
    extends Strategy<FixedWindowStrategy>
    implements Windowed, Limited
{
    constructor(
        private storage: Storage,
        private options: FixedWindowStrategyOptions
    ) {
        super()
        this.options.startTimeMs = this.options.startTimeMs ?? 0
    }

    getWindowMs(): number {
        return this.options.windowMs
    }

    getLimit(): number {
        return this.options.limit
    }

    async check(identifier: string) {
        const now = Date.now()
        const { windowMs, limit, startTimeMs } = this.options

        const currentWindowIndex = Math.floor((now - startTimeMs!) / windowMs)

        const windowKey = `${identifier}:${currentWindowIndex}`

        const windowEndTime = startTimeMs! + (currentWindowIndex + 1) * windowMs
        const ttlMs = Math.max(1, windowEndTime - now)

        const result = await (this.storage as any).incrementIf(windowKey, limit, ttlMs)

        return {
            allowed: result.incremented,
            remaining: Math.max(0, limit - result.value),
            reset: windowEndTime,
        }
    }
}

export function createFixedWindowStrategy(options: FixedWindowStrategyOptions) {
    return (context: { storage: Storage }) => {
        return new FixedWindowStrategy(context.storage, options)
    }
}
