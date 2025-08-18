import {
    TokenBucketLimiterFactory,
    createTokenBucketLimiterFactory,
} from '@/factory/strategies/token-bucket-factory'
import { TokenBucketStrategy, type TokenBucketOptions } from '@/strategy/token-bucket'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryStorage } from '../../unit/test-storage'

describe('TokenBucketLimiterFactory', () => {
    let storageFactory: any

    beforeEach(() => {
        storageFactory = (_config: any) => new InMemoryStorage()
    })

    it('should create a new instance of TokenBucketLimiterFactory', () => {
        const factory = new TokenBucketLimiterFactory(storageFactory)
        expect(factory).toBeInstanceOf(TokenBucketLimiterFactory)
    })

    it('should create a token bucket limiter factory function', () => {
        const factoryFn = createTokenBucketLimiterFactory(storageFactory)
        expect(typeof factoryFn).toBe('function')
    })

    it('should create a rate limiter with the correct strategy', async () => {
        const factoryFn = createTokenBucketLimiterFactory(storageFactory)

        const config = {
            strategy: { capacity: 10, refillRate: 1, refillTime: 1000 } as TokenBucketOptions,
            storage: {},
            prefix: 'test',
        }

        const result = await factoryFn(config)

        expect(result.limiter).toBeDefined()
        expect(result.strategy).toBeInstanceOf(TokenBucketStrategy)
        expect(result.storage).toBeInstanceOf(InMemoryStorage)
    })
})
