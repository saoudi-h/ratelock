import { beforeEach, describe, expect, it } from 'vitest'
import { IndividualFixedWindowLimiterFactory, createIndividualFixedWindowLimiterFactory } from '@/factory/strategies/individual-fixed-window-factory'
import { IndividualFixedWindowStrategy, type IndividualFixedWindowOptions } from '@/strategy/individual-fixed-window'
import { InMemoryStorage } from '../../unit/test-storage'

describe('IndividualFixedWindowLimiterFactory', () => {
  let storageFactory: any
  
  beforeEach(() => {
    storageFactory = (_config: any) => new InMemoryStorage()
  })
  
  it('should create a new instance of IndividualFixedWindowLimiterFactory', () => {
    const factory = new IndividualFixedWindowLimiterFactory(storageFactory)
    expect(factory).toBeInstanceOf(IndividualFixedWindowLimiterFactory)
  })
  
  it('should create an individual fixed window limiter factory function', () => {
    const factoryFn = createIndividualFixedWindowLimiterFactory(storageFactory)
    expect(typeof factoryFn).toBe('function')
  })
  
  it('should create a rate limiter with the correct strategy', async () => {
    const factoryFn = createIndividualFixedWindowLimiterFactory(storageFactory)
    
    const config = {
      strategy: { limit: 10, windowMs: 1000 } as IndividualFixedWindowOptions,
      storage: {},
      prefix: 'test',
    }
    
    const result = await factoryFn(config)
    
    expect(result.limiter).toBeDefined()
    expect(result.strategy).toBeInstanceOf(IndividualFixedWindowStrategy)
    expect(result.storage).toBeInstanceOf(InMemoryStorage)
  })
})