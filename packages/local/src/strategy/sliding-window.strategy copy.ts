import type { Storage } from '@ratelock/core/storage'
import type { Limited, Windowed } from '@ratelock/core/strategy'
import { Strategy } from '@ratelock/core/strategy'

export class SlidingWindowStrategy
    extends Strategy<SlidingWindowStrategy>
    implements Windowed, Limited
{
    private storage: Storage
    private windowMs: number
    private requestLimit: number

    constructor(storage: Storage, windowMs: number, requestLimit: number) {
        super()
        this.storage = storage
        this.windowMs = windowMs
        this.requestLimit = requestLimit
    }
    getLimit(): number {
        return this.requestLimit
    }

    getWindowMs(): number {
        return this.windowMs
    }

    async check(identifier: string) {
        const now = Date.now()
        await this.storage.addTimestamp(identifier, now, this.windowMs)

        const currentRequests = await this.storage.countTimestamps(identifier, this.windowMs)

        const allowed = currentRequests <= this.requestLimit

        let remaining = 0
        let reset = now + this.windowMs

        if (allowed) {
            remaining = this.requestLimit - currentRequests
        } else {
            const oldestTimestamp = await this.storage.getOldestTimestamp(identifier)
            if (oldestTimestamp !== null) {
                reset = oldestTimestamp + this.windowMs
            }
        }

        return {
            allowed,
            remaining,
            reset,
            limit: this.requestLimit,
        }
    }
}
