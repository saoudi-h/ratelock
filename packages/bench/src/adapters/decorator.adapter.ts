import { withCache, withCircuitBreaker, withFallback, withRetry } from '@ratelock/core'
import { fixedWindow as createLocalFixed } from '@ratelock/local'
import { config } from '../config'
import { type FaultProfile, type FaultStats, wrapWithFaults } from './fault-injector'
import type { BenchmarkAdapter } from './types'

export type DecoratorType = 'none' | 'cache' | 'circuitbreaker' | 'fallback' | 'retry'
export type DecoratorBackend = 'local' | 'redis'
export type DecoratorStrategy = 'fixed-window' | 'sliding-window' | 'token-bucket'

interface RedisHandle {
    client: any
    destroy: () => Promise<void>
}

async function createBaseLimiter(
    backend: DecoratorBackend,
    strategy: DecoratorStrategy,
    fault?: FaultProfile
): Promise<{ limiter: any; handle?: RedisHandle; faultStats?: () => FaultStats }> {
    if (backend === 'local') {
        if (strategy !== 'fixed-window') {
            throw new Error(`Decorator on local currently supports fixed-window only`)
        }
        const limiter = await createLocalFixed({
            limit: config.limit,
            windowMs: config.windowMs,
        })
        return { limiter }
    }

    // redis
    const { default: IORedis } = await import('ioredis')
    const client = new IORedis(config.redisUrl, {
        maxRetriesPerRequest: 0,
        connectTimeout: 1000,
        lazyConnect: true,
    })
    client.on('error', () => {
        // Swallow background errors to prevent uncaught exceptions
    })
    await client.connect()
    await client.ping()

    // If a fault profile is given, wrap the raw client BEFORE handing it to
    // @ratelock/redis. The proxy preserves the original prototype (so
    // `adaptClient` recognises it as ioredis) and only intercepts the
    // methods the limiter calls. Errors propagate up through the limiter
    // and the decorators catch them as if they were real.
    let clientForLimiter: any = client
    let faultStats: (() => FaultStats) | undefined
    if (fault) {
        const wrapped = wrapWithFaults(client, fault)
        clientForLimiter = wrapped
        faultStats = () => (wrapped as unknown as { faultStats: FaultStats }).faultStats
    }

    const { fixedWindow, slidingWindow, tokenBucket } = await import('@ratelock/redis')
    const opts: any = { client: clientForLimiter, limit: config.limit, windowMs: config.windowMs }
    let limiter: any
    switch (strategy) {
        case 'fixed-window':
            limiter = await fixedWindow(opts)
            break
        case 'sliding-window':
            limiter = await slidingWindow(opts)
            break
        case 'token-bucket':
            limiter = await tokenBucket({
                client: clientForLimiter,
                capacity: config.limit,
                refillRate: config.limit / 60,
            })
            break
    }
    return {
        limiter,
        handle: {
            client,
            destroy: async () => client.disconnect(),
        },
        faultStats,
    }
}

export class DecoratorAdapter implements BenchmarkAdapter {
    public readonly name: string
    private readonly decoratorType: DecoratorType
    private readonly backend: DecoratorBackend
    private readonly strategy: DecoratorStrategy
    private readonly fault?: FaultProfile
    private decoratedLimiter: any
    private redisHandle?: RedisHandle
    private faultStatsFn?: () => FaultStats

    constructor(
        name: string,
        decoratorType: DecoratorType,
        options?: {
            backend?: DecoratorBackend
            strategy?: DecoratorStrategy
            fault?: FaultProfile
        }
    ) {
        this.name = name
        this.decoratorType = decoratorType
        this.backend = options?.backend ?? 'local'
        this.strategy = options?.strategy ?? 'fixed-window'
        this.fault = options?.fault
    }

    async initialize(): Promise<void> {
        const { limiter, handle, faultStats } = await createBaseLimiter(
            this.backend,
            this.strategy,
            this.fault
        )
        this.redisHandle = handle
        this.faultStatsFn = faultStats

        switch (this.decoratorType) {
            case 'cache':
                this.decoratedLimiter = withCache(limiter, { ttlMs: 100, maxSize: 1000 })
                break
            case 'circuitbreaker':
                this.decoratedLimiter = withCircuitBreaker(limiter, {
                    failureThreshold: 3,
                    recoveryTimeoutMs: 1000,
                })
                break
            case 'fallback':
                this.decoratedLimiter = withFallback(limiter, 'allow', {
                    remaining: 0,
                    reset: Date.now() + config.windowMs,
                } as any)
                break
            case 'retry':
                this.decoratedLimiter = withRetry(limiter, {
                    maxAttempts: 3,
                    baseDelayMs: 2,
                    maxDelayMs: 10,
                })
                break
            default:
                this.decoratedLimiter = limiter
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

    getFaultStats(): FaultStats | undefined {
        return this.faultStatsFn?.()
    }

    async destroy(): Promise<void> {
        if (this.redisHandle) {
            await this.redisHandle.destroy()
            this.redisHandle = undefined
        }
    }
}
