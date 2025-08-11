import { beforeEach, describe, expect, it } from 'vitest'
import { SlidingWindowLimiterFactory, createSlidingWindowLimiterFactory } from '@/factory/strategies/sliding-window-factory'
import { SlidingWindowStrategy, type SlidingWindowOptions } from '@/strategy/sliding-window'
import { InMemoryStorage } from '../../unit/test-storage'

describe('SlidingWindowLimiterFactory', () => {
  let storageFactory: any
  
  beforeEach(() => {
    storageFactory = (_config: any) => new InMemoryStorage()
  })
  
  it('should create a new instance of SlidingWindowLimiterFactory', () => {
    const factory = new SlidingWindowLimiterFactory(storageFactory)
    expect(factory).toBeInstanceOf(SlidingWindowLimiterFactory)
  })
  
  it('should create a sliding window limiter factory function', () => {
    const factoryFn = createSlidingWindowLimiterFactory(storageFactory)
    expect(typeof factoryFn).toBe('function')
  })
  
  it('should create a rate limiter with the correct strategy', async () => {
    const factoryFn = createSlidingWindowLimiterFactory(storageFactory)
    
    const config = {
      strategy: { limit: 10, windowMs: 1000 } as SlidingWindowOptions,
      storage: {},
      prefix: 'test',
    }
    
    const result = await factoryFn(config)
    
    expect(result.limiter).toBeDefined()
    expect(result.strategy).toBeInstanceOf(SlidingWindowStrategy)
    expect(result.storage).toBeInstanceOf(InMemoryStorage)
  })
})