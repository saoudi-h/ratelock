import { withCache, withCircuitBreaker, withFallback, withRetry } from '@ratelock/core'
import { fixedWindow as createLocalFixed } from '@ratelock/local'
import { config } from '../config'
import type { BenchmarkAdapter } from './types'

export type DecoratorType = 'none' | 'cache' | 'circuitbreaker' | 'fallback' | 'retry'

export class DecoratorAdapter implements BenchmarkAdapter {
    public readonly name: string
    private readonly decoratorType: DecoratorType
    private baseLimiter: any
    private decoratedLimiter: any

    constructor(name: string, decoratorType: DecoratorType) {
        this.name = name
        this.decoratorType = decoratorType
    }

    async initialize(): Promise<void> {
        this.baseLimiter = await createLocalFixed({
            limit: config.limit,
            windowMs: config.windowMs,
        })

        switch (this.decoratorType) {
            case 'cache':
                this.decoratedLimiter = withCache(this.baseLimiter, { ttlMs: 100, maxSize: 1000 })
                break
            case 'circuitbreaker':
                this.decoratedLimiter = withCircuitBreaker(this.baseLimiter, {
                    failureThreshold: 3,
                    recoveryTimeoutMs: 1000,
                })
                break
            case 'fallback':
                this.decoratedLimiter = withFallback(this.baseLimiter, 'allow', {
                    remaining: 0,
                    reset: Date.now() + config.windowMs,
                } as any)
                break
            case 'retry':
                this.decoratedLimiter = withRetry(this.baseLimiter, {
                    maxAttempts: 2,
                    baseDelayMs: 1,
                    maxDelayMs: 5,
                })
                break
            default:
                this.decoratedLimiter = this.baseLimiter
                break
        }
    }

    async check(key: string | string[]): Promise<{ allowed: boolean }> {
        if (Array.isArray(key)) {
            const results = await Promise.all(key.map(k => this.decoratedLimiter.check(k)))
            return { allowed: results.every(r => r.allowed !== false) }
        }
        const res = await this.decoratedLimiter.check(key)
        return { allowed: res.allowed !== false }
    }

    async destroy(): Promise<void> {
        // No-op
    }
}
