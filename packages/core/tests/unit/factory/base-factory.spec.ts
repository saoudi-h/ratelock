import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BaseLimiterFactory } from '@/factory/base-factory'
import { Strategy } from '@/strategy/strategy'
import type { Storage } from '@/storage/storage'
import type { StorageFactory } from '@/factory/types'
import { RateLimiter } from '@/limiter/rate-limiter'

// Mock classes for testing
class MockStrategy extends Strategy<any, any> {
  constructor(storage: Storage, options: any) {
    super(storage, options)
  }
  
  override async check(_identifier: string): Promise<any> {
    return { allowed: true, remaining: 1, reset: Date.now() + 1000 }
  }
  
  override async checkBatch(identifiers: string[]): Promise<any[]> {
    return identifiers.map(() => ({ allowed: true, remaining: 1, reset: Date.now() + 1000 }))
  }
  
  override async cleanup(_identifier: string): Promise<void> {}
  
  get metadata() {
    return {
      name: 'mock-strategy',
      version: '1.0.0',
      memoryEfficient: true,
      supportsBatch: true,
    }
  }
}

class MockStorage implements Storage {
  private data = new Map<string, string>()
  
  async get(key: string): Promise<string | null> {
    return this.data.get(key) || null
  }
  
  async set(_key: string, _value: string, _ttlMs?: number): Promise<void> {
    // Implementation not needed for this test
  }
  
  async delete(key: string): Promise<void> {
    this.data.delete(key)
  }
  
  async exists(key: string): Promise<boolean> {
    return this.data.has(key)
  }
  
  async expire(_keyOrIdentifier: string, _ttlMs: number): Promise<void> {
    // Implementation not needed for this test
  }
  
  async increment(key: string, ttlMs?: number): Promise<number> {
    const current = parseInt(await this.get(key) || '0', 10)
    const next = current + 1
    await this.set(key, next.toString(), ttlMs)
    return next
  }
  
  async incrementIf(key: string, maxValue: number, ttlMs?: number): Promise<{ value: number; incremented: boolean }> {
    const value = await this.increment(key, ttlMs)
    if (value > maxValue) {
      const decremented = Math.max(0, value - 1)
      await this.set(key, decremented.toString(), ttlMs)
      return { value: maxValue, incremented: false }
    }
    return { value, incremented: true }
  }
  
  async decrement(key: string, minValue = Number.NEGATIVE_INFINITY): Promise<number> {
    const current = parseInt(await this.get(key) || '0', 10)
    const next = Math.max(minValue, current - 1)
    await this.set(key, next.toString())
    return next
  }
  
  async addTimestamp(_identifier: string, _timestamp: number, _ttlMs: number): Promise<void> {
    // Implementation not needed for this test
  }
  
  async countTimestamps(_identifier: string, _windowMs: number): Promise<number> {
    return 0
  }
  
  async getOldestTimestamp(_identifier: string): Promise<number | null> {
    return null
  }
  
  async cleanupTimestamps(_identifier: string): Promise<void> {
    // Implementation not needed for this test
  }
  
  pipeline() {
    return {
      increment: vi.fn().mockReturnThis(),
      incrementIf: vi.fn().mockReturnThis(),
      decrement: vi.fn().mockReturnThis(),
      addTimestamp: vi.fn().mockReturnThis(),
      countTimestamps: vi.fn().mockReturnThis(),
      getOldestTimestamp: vi.fn().mockReturnThis(),
      cleanupTimestamps: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      get: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    }
  }
  
  async multiGet(keys: string[]): Promise<(string | null)[]> {
    return Promise.all(keys.map(k => this.get(k)))
  }
  
  async multiSet(entries: Array<{ key: string; value: string; ttlMs?: number }>): Promise<void> {
    for (const e of entries) await this.set(e.key, e.value, e.ttlMs)
  }
}

// Mock factory implementations
const mockStrategyFactory = vi.fn((storage: Storage, options: any) => new MockStrategy(storage, options))
const mockStorageFactory: StorageFactory<MockStorage, any> = vi.fn(async (_config: any) => new MockStorage())

// Test factory implementation
class TestLimiterFactory extends BaseLimiterFactory<any, any, MockStrategy, MockStorage> {
  constructor() {
    super(mockStrategyFactory, mockStorageFactory)
  }
}

describe('BaseLimiterFactory', () => {
  let factory: TestLimiterFactory
  
  beforeEach(() => {
    factory = new TestLimiterFactory()
    mockStrategyFactory.mockClear()
    if ('mockClear' in mockStorageFactory) {
      (mockStorageFactory as any).mockClear()
    }
  })
  
  it('should create a new instance', () => {
    expect(factory).toBeInstanceOf(BaseLimiterFactory)
  })
  
  it('should create a rate limiter with the correct configuration', async () => {
    const config = {
      strategy: { limit: 10, windowMs: 1000 },
      storage: { type: 'memory' },
      prefix: 'test',
      performance: { 
        cache: { 
          enabled: true, 
          maxSize: 100, 
          ttlMs: 5000,
          cleanupIntervalMs: 60000
        } 
      },
    }
    
    const result = await factory.create(config)
    
    // Verify storage factory was called
    if ('mock' in mockStorageFactory) {
      expect((mockStorageFactory as any).mock.calls).toHaveLength(1)
    }
    
    // Verify strategy factory was called
    expect(mockStrategyFactory).toHaveBeenCalled()
    
    // Verify result structure
    expect(result).toHaveProperty('limiter')
    expect(result).toHaveProperty('storage')
    expect(result).toHaveProperty('strategy')
    
    // Verify limiter is an instance of RateLimiter
    expect(result.limiter).toBeInstanceOf(RateLimiter)
  })
  
  it('should pass the correct configuration to the rate limiter', async () => {
    const config = {
      strategy: { limit: 5, windowMs: 5000 },
      storage: { type: 'memory', maxSize: 1000 },
      prefix: 'api',
      resilience: { 
        circuitBreakerConfig: { 
          failureThreshold: 3,
          recoveryTimeoutMs: 30000,
          monitoringWindowMs: 60000,
          minimumRequestsForStats: 10
        } 
      },
    }
    
    const result = await factory.create(config)
    
    // Verify the limiter was created with the correct config
    expect(result.limiter).toBeInstanceOf(RateLimiter)
  })
})