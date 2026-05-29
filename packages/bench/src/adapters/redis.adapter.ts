import { config } from '../config'
import type { BenchmarkAdapter } from './types'

export type RedisStrategy =
    | 'fixed-window'
    | 'sliding-window'
    | 'token-bucket'
    | 'individual-fixed-window'
export type RedisClientType = 'ioredis' | 'redis'

export class RedisAdapter implements BenchmarkAdapter {
    public readonly name: string
    private readonly strategy: RedisStrategy
    private readonly clientType: RedisClientType
    private readonly url: string

    private client: any
    private limiter: any

    constructor(options: {
        name: string
        strategy: RedisStrategy
        clientType?: RedisClientType
        url?: string
    }) {
        this.name = options.name
        this.strategy = options.strategy
        this.clientType = options.clientType ?? 'ioredis'
        this.url = options.url ?? config.redisUrl
    }

    async initialize(): Promise<void> {
        if (this.clientType === 'ioredis') {
            const { default: IORedis } = await import('ioredis')
            this.client = new IORedis(this.url, {
                maxRetriesPerRequest: 0,
                connectTimeout: 1000,
                lazyConnect: true,
            })
            this.client.on('error', () => {
                // Swallow background connection error events to prevent Node uncaught exceptions
            })
            await this.client.connect()
            await this.client.ping()
        } else {
            const { createClient } = await import('redis')
            this.client = createClient({
                url: this.url,
                socket: {
                    connectTimeout: 1000,
                    reconnectStrategy: () => false,
                },
            })
            this.client.on('error', () => {
                // Swallow background connection error events to prevent Node uncaught exceptions
            })
            await this.client.connect()
            await this.client.ping()
        }

        const { fixedWindow, slidingWindow, tokenBucket, individualFixedWindow } =
            await import('@ratelock/redis')

        const opts: any = {
            client: this.client,
            limit: config.limit,
            windowMs: config.windowMs,
        }

        switch (this.strategy) {
            case 'fixed-window':
                this.limiter = await fixedWindow(opts)
                break
            case 'sliding-window':
                this.limiter = await slidingWindow(opts)
                break
            case 'token-bucket':
                this.limiter = await tokenBucket({
                    client: this.client,
                    capacity: config.limit,
                    refillRate: config.limit / 60,
                })
                break
            case 'individual-fixed-window':
                this.limiter = await individualFixedWindow(opts)
                break
        }
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
        if (this.client) {
            if (this.clientType === 'ioredis') {
                this.client.disconnect()
            } else {
                await this.client.quit()
            }
        }
    }
}
