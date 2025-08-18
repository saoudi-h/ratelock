import type { BatchConfig } from '../cache/batch-processor'
import { CachedStorage } from '../cache/cached-storage'
import { LazyTimestampCleaner } from '../cache/lazy-timestamp-cleaner'
import type { CircuitState } from '../error/circuit-breaker'
import { CircuitBreaker } from '../error/circuit-breaker'
import { RetryService } from '../error/retry'
import type { Storage } from '../storage/storage'
import type { BaseResult } from '../strategy/base'
import type { InferStrategyResult } from '../strategy/capabilities'
import type { Strategy } from '../strategy/strategy'
import type { Limiter, LimiterOptions, RateLimiterPerformanceOptions } from './limiter'

export type InferLimiterResult<S> =
    S extends Strategy<infer T> ? InferStrategyResult<T> : BaseResult

export class RateLimiter<S extends Strategy<any>> implements Limiter<InferLimiterResult<S>> {
    public readonly prefix: string
    public readonly strategy: S
    public readonly storage: Storage
    private readonly errorPolicy: 'throw' | 'allow' | 'deny'
    private perf?: { cached?: CachedStorage; cleaner?: LazyTimestampCleaner }
    private retry?: RetryService
    private circuit?: CircuitBreaker

    constructor(options: LimiterOptions<S>) {
        this.prefix = options.prefix ?? 'ratelock'
        this.errorPolicy = options.errorPolicy ?? 'throw'

        // Build effective storage (optionally wrapped with cache/batch)
        const effectiveStorage = this.buildEffectiveStorage(options.storage, options.performance)

        if (options.strategy) {
            this.strategy = options.strategy
        } else {
            throw new Error('Either strategy or strategyFactory must be provided')
        }

        this.storage = effectiveStorage

        // Resilience wiring if requested
        if (options.resilience?.retryConfig) {
            this.retry = new RetryService(options.resilience.retryConfig)
        }
        if (options.resilience?.circuitBreakerConfig) {
            this.circuit = new CircuitBreaker(options.resilience.circuitBreakerConfig)
        }
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
        const operation = async () => this.strategy.check(key)

        let exec: Promise<InferLimiterResult<S>>
        if (this.circuit) {
            exec = this.circuit.execute(operation) as Promise<InferLimiterResult<S>>
        } else if (this.retry) {
            exec = this.retry.execute(operation) as Promise<InferLimiterResult<S>>
        } else {
            exec = operation() as Promise<InferLimiterResult<S>>
        }

        const resultPromise = exec
        const res = (await this.handleStorageError(resultPromise)) as InferLimiterResult<S>

        // Lazy cleanup scheduling when enabled
        if (this.perf?.cleaner) {
            const allowed = (res as { allowed?: boolean }).allowed ?? true
            const priority = allowed ? 1 : 2
            this.perf.cleaner.scheduleCleanup(key, priority)
        }

        return res
    }

    async checkBatch(identifiers: string[]): Promise<Array<InferLimiterResult<S>>> {
        if (this.strategy.checkBatch) {
            const keys = identifiers.map(id => `${this.prefix}:${id}`)
            const out = await this.strategy.checkBatch(keys)
            return out as Array<InferLimiterResult<S>>
        }
        const results: Array<InferLimiterResult<S>> = []
        for (const id of identifiers) {
            results.push(await this.check(id))
        }
        return results
    }

    getStats(): {
        cache?: ReturnType<CachedStorage['getCacheStats']>
        circuitState?: CircuitState
    } {
        const out: {
            cache?: ReturnType<CachedStorage['getCacheStats']>
            circuitState?: CircuitState
        } = {}
        if (this.perf?.cached) out.cache = this.perf.cached.getCacheStats()
        if (this.circuit) out.circuitState = this.circuit.getMetrics().state
        return out
    }

    stop(): void {
        this.perf?.cached?.stop()
    }

    private buildEffectiveStorage(base: Storage, perf?: RateLimiterPerformanceOptions): Storage {
        if (!perf || (!perf.cache && !perf.batch && !perf.lazyCleanup)) {
            return base
        }
        const cached = new CachedStorage(
            base,
            perf.cache ?? {
                enabled: false,
                maxSize: 0,
                ttlMs: 0,
                cleanupIntervalMs: 60_000,
            },
            perf.batch as BatchConfig | undefined
        )
        this.perf = { cached }
        if (perf.lazyCleanup) {
            this.perf.cleaner = new LazyTimestampCleaner(cached, perf.lazyCleanup)
        }
        return cached
    }
}
