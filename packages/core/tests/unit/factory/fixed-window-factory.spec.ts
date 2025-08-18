import {
    FixedWindowLimiterFactory,
    createFixedWindowLimiterFactory,
} from '@/factory/strategies/fixed-window-factory'
import { FixedWindowStrategy, type FixedWindowOptions } from '@/strategy/fixed-window'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryStorage } from '../../unit/test-storage'

describe('FixedWindowLimiterFactory', () => {
    let storageFactory: any

    beforeEach(() => {
        storageFactory = (_config: any) => new InMemoryStorage()
    })

    it('should create a new instance of FixedWindowLimiterFactory', () => {
        const factory = new FixedWindowLimiterFactory(storageFactory)
        expect(factory).toBeInstanceOf(FixedWindowLimiterFactory)
    })

    it('should create a fixed window limiter factory function', () => {
        const factoryFn = createFixedWindowLimiterFactory(storageFactory)
        expect(typeof factoryFn).toBe('function')
    })

    it('should create a rate limiter with the correct strategy', async () => {
        const factoryFn = createFixedWindowLimiterFactory(storageFactory)

        const config = {
            strategy: { limit: 10, windowMs: 1000 } as FixedWindowOptions,
            storage: {},
            prefix: 'test',
        }

        const result = await factoryFn(config)

        expect(result.limiter).toBeDefined()
        expect(result.strategy).toBeInstanceOf(FixedWindowStrategy)
        expect(result.storage).toBeInstanceOf(InMemoryStorage)
    })
})
