import type { Storage } from '@ratelock/core/storage'
import type { IndividualTracking, Limited, Windowed } from '@ratelock/core/strategy'
import { Strategy } from '@ratelock/core/strategy'

export interface IndividualFixedWindowStrategyOptions {
    limit: number
    windowMs: number
}

export class IndividualFixedWindowStrategy
    extends Strategy<IndividualFixedWindowStrategy>
    implements Windowed, Limited, IndividualTracking
{
    constructor(
        private storage: Storage,
        private options: IndividualFixedWindowStrategyOptions
    ) {
        super()
    }

    getWindowMs(): number {
        return this.options.windowMs
    }

    getLimit(): number {
        return this.options.limit
    }

    getTrackingKey(identifier: string): string {
        return `ifw:${identifier}`
    }

    async check(identifier: string) {
        const now = Date.now()
        const { windowMs, limit } = this.options

        const metaKey = `${identifier}:meta` 
        const lockKey = `${identifier}:lock` 

        const lockTtl = 1000 
        const lockAcquired = await this.tryAcquireLock(lockKey, lockTtl)

        if (!lockAcquired) {
            return {
                allowed: false,
                remaining: 0,
                reset: now + windowMs,
                firstRequest: now,
            }
        }

        try {
            const metaDataRaw = await this.storage.get(metaKey)
            let metaData: { firstRequest: number; currentCount: number } | null = null

            if (metaDataRaw) {
                try {
                    metaData = JSON.parse(metaDataRaw)
                } catch {
                    metaData = null
                }
            }

            let firstRequest: number
            let currentCount: number
            let windowExpired = false

            if (!metaData) {
                firstRequest = now
                currentCount = 0
            } else {
                firstRequest = metaData.firstRequest
                currentCount = metaData.currentCount

                windowExpired = now - firstRequest >= windowMs

                if (windowExpired) {
                    firstRequest = now
                    currentCount = 0
                }
            }

            const allowed = currentCount < limit

            if (allowed) {
                currentCount += 1

                const newMetaData = { firstRequest, currentCount }
                const remainingWindowTime = windowMs - (now - firstRequest)
                const ttlMs = Math.max(1, remainingWindowTime + 1000) 

                await this.storage.set(metaKey, JSON.stringify(newMetaData), ttlMs)
            }

            const remaining = Math.max(0, limit - currentCount)
            const reset = firstRequest + windowMs

            return {
                allowed,
                remaining,
                reset,
                firstRequest,
            }
        } finally {
            await this.storage.delete(lockKey)
        }
    }

    private async tryAcquireLock(lockKey: string, ttlMs: number): Promise<boolean> {
        try {
            const existing = await this.storage.get(lockKey)
            if (existing) {
                return false 
            }

            await this.storage.set(lockKey, Date.now().toString(), ttlMs)

            const verification = await this.storage.get(lockKey)
            return verification !== null
        } catch {
            return false
        }
    }
}

export function createIndividualFixedWindowStrategy(options: IndividualFixedWindowStrategyOptions) {
    return (context: { storage: Storage }) => {
        return new IndividualFixedWindowStrategy(context.storage, options)
    }
}
