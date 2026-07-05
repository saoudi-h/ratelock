import { slidingWindow as createLocalSliding } from '@ratelock/local'
import { config } from '../config'
import type { BenchmarkAdapter } from './types'

export class LocalSlidingAdapter implements BenchmarkAdapter {
    name = 'Local Sliding Window'
    private limiter: any

    async initialize(): Promise<void> {
        this.limiter = await createLocalSliding({
            limit: config.limit,
            windowMs: config.windowMs,
        })
    }

    async check(key: string | string[]): Promise<{ allowed: boolean }> {
        if (Array.isArray(key)) {
            const results = await Promise.all(key.map(k => this.limiter.check(k)))
            return { allowed: results.every(r => r.allowed !== false) }
        }
        const res = await this.limiter.check(key)
        return { allowed: res.allowed !== false }
    }

    async destroy(): Promise<void> {
        // No-op for in-memory
    }
}
