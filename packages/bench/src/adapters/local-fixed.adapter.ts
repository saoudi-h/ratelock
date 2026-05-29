import { fixedWindow as createLocalFixed } from '@ratelock/local'
import { config } from '../config'
import type { BenchmarkAdapter } from './types'

export class LocalFixedAdapter implements BenchmarkAdapter {
    name = 'Local Fixed Window'
    private limiter: any

    constructor(name?: string) {
        if (name) {
            this.name = name
        }
    }

    async initialize(): Promise<void> {
        this.limiter = await createLocalFixed({
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
