import { tokenBucket as createLocalToken } from '@ratelock/local'
import { config } from '../config'
import type { BenchmarkAdapter } from './types'

export class LocalTokenAdapter implements BenchmarkAdapter {
    name = 'Local Token Bucket'
    private limiter: any

    async initialize(): Promise<void> {
        this.limiter = await createLocalToken({
            capacity: config.limit,
            refillRate: config.limit / 60,
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
