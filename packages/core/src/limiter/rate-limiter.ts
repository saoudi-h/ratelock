import type { Storage } from '../storage/storage'
import type { BaseResult } from '../strategy/base'
import type { InferStrategyResult } from '../strategy/behaviors'
import type { Strategy } from '../strategy/strategy'
import type { Limiter, LimiterOptions } from './limiter'

type InferLimiterResult<S> = S extends Strategy<infer T> ? InferStrategyResult<T> : BaseResult

export class RateLimiter<S extends Strategy<any>> implements Limiter<InferLimiterResult<S>> {
    public readonly prefix: string
    public readonly strategy: S
    public readonly storage: Storage
    private readonly errorPolicy: 'throw' | 'allow' | 'deny'

    constructor(options: LimiterOptions<S>) {
        this.prefix = options.prefix ?? 'ratelock'
        this.strategy = options.strategy
        this.storage = options.storage
        this.errorPolicy = options.errorPolicy ?? 'throw'
    }

    private async handleStorageError<T extends BaseResult>(
        promise: Promise<T>
    ): Promise<T | BaseResult> {
        try {
            return await promise
        } catch (error) {
            console.error('Limiter storage error:', error)

            switch (this.errorPolicy) {
                case 'allow':
                    return { allowed: true }
                case 'deny':
                    return { allowed: false }
                case 'throw':
                default:
                    throw error
            }
        }
    }

    async check(identifier: string): Promise<InferLimiterResult<S>> {
        const key = `${this.prefix}:${identifier}`
        const resultPromise = this.strategy.check(key)
        return this.handleStorageError(resultPromise) as Promise<InferLimiterResult<S>>
    }
}
