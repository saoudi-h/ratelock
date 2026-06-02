import { config } from '../config'
import type { BenchmarkAdapter } from './types'

export class RlfRedisAdapter implements BenchmarkAdapter {
    name = 'rate-limiter-flexible Redis'
    private client: any
    private limiter: any

    async initialize(): Promise<void> {
        const { default: IORedis } = await import('ioredis')
        this.client = new IORedis(config.redisUrl, {
            maxRetriesPerRequest: 0,
            connectTimeout: 1000,
            lazyConnect: true,
        })
        this.client.on('error', () => {
            // Swallow background connection error events to prevent Node uncaught exceptions
        })
        await this.client.connect()
        await this.client.ping()

        const { RateLimiterRedis } = await import('rate-limiter-flexible')
        this.limiter = new RateLimiterRedis({
            storeClient: this.client,
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
        if (this.client) {
            this.client.disconnect()
        }
    }
}
