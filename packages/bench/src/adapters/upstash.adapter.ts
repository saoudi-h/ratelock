import { fixedWindow, individualFixedWindow, slidingWindow, tokenBucket } from '@ratelock/upstash'
import { Redis } from '@upstash/redis'

import { config } from '../config'
import type { BenchmarkAdapter } from './types'

export type UpstashStrategy =
    | 'fixed-window'
    | 'sliding-window'
    | 'token-bucket'
    | 'individual-fixed-window'

type BenchmarkLimiter = {
    check(id: string): Promise<{ allowed: boolean }>
    checkBatch(ids: string[]): Promise<Array<{ allowed: boolean }>>
    destroy?(): Promise<void>
}

export class UpstashAdapter implements BenchmarkAdapter {
    public readonly name: string
    private readonly strategy: UpstashStrategy
    private readonly prefix: string

    private limiter: BenchmarkLimiter | undefined

    constructor(options: { name?: string; strategy: UpstashStrategy; prefix: string }) {
        this.strategy = options.strategy
        this.name = options.name ?? `Upstash ${options.strategy}`
        this.prefix = options.prefix
    }

    async initialize(): Promise<void> {
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            throw new Error(
                'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN before running the Upstash benchmark'
            )
        }

        const client = Redis.fromEnv({
            enableAutoPipelining: false,
            enableTelemetry: false,
            retry: false,
        })

        const common = {
            client,
            limit: config.limit,
            windowMs: config.windowMs,
            prefix: this.prefix,
        }

        switch (this.strategy) {
            case 'fixed-window':
                this.limiter = await fixedWindow(common)
                break
            case 'sliding-window':
                this.limiter = await slidingWindow(common)
                break
            case 'token-bucket':
                this.limiter = await tokenBucket({
                    client,
                    capacity: config.limit,
                    refillRate: config.limit / (config.windowMs / 1000),
                    prefix: this.prefix,
                })
                break
            case 'individual-fixed-window':
                this.limiter = await individualFixedWindow(common)
                break
        }
    }

    async check(key: string | string[]): Promise<{ allowed: boolean }> {
        if (!this.limiter) throw new Error('Upstash adapter is not initialized')

        if (Array.isArray(key)) {
            const results = await this.limiter.checkBatch(key)
            return { allowed: results.every(result => result.allowed) }
        }

        const result = await this.limiter.check(key)
        return { allowed: result.allowed }
    }

    async destroy(): Promise<void> {
        await this.limiter?.destroy?.()
        this.limiter = undefined
    }
}
