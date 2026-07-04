import { config } from '../config'
import type { BenchmarkAdapter } from './types'

export class RlfMemoryAdapter implements BenchmarkAdapter {
    name = 'rate-limiter-flexible Memory'
    private limiter: any

    async initialize(): Promise<void> {
        const { RateLimiterMemory } = await import('rate-limiter-flexible')
        this.limiter = new RateLimiterMemory({
            points: config.limit,
            duration: config.windowMs / 1000,
        })
    }

    async check(key: string | string[]): Promise<{ allowed: boolean }> {
        const keys = Array.isArray(key) ? key : [key]
        const results = await Promise.all(
            keys.map(async k => {
                try {
                    await this.limiter.consume(k, 1)
                    return true
                } catch {
                    return false
                }
            })
        )
        return { allowed: results.every(Boolean) }
    }

    async destroy(): Promise<void> {
        // No-op
    }
}
