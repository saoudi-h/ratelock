import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StorageService } from '../../src/storage/storage.service'
import type { RedisClientType } from 'redis'

const mockClient = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  pExpire: vi.fn(),
  eval: vi.fn(),
  zAdd: vi.fn(),
  zCount: vi.fn(),
  zRangeWithScores: vi.fn(),
  mGet: vi.fn(),
  multi: vi.fn().mockReturnThis(),
  exec: vi.fn(),
}

describe('StorageService', () => {
  let storage: StorageService
  let client: unknown

  beforeEach(() => {
    client = mockClient
    storage = new StorageService(client as RedisClientType)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('get', () => {
    it('should call client.get with the correct key', async () => {
      await storage.get('test-key')
      expect(mockClient.get).toHaveBeenCalledWith('test-key')
    })
  })

  describe('set', () => {
    it('should call client.set with key and value', async () => {
      await storage.set('test-key', 'test-value')
      expect(mockClient.set).toHaveBeenCalledWith('test-key', 'test-value')
    })

    it('should call client.set with TTL when provided', async () => {
      await storage.set('test-key', 'test-value', 1000)
      expect(mockClient.set).toHaveBeenCalledWith('test-key', 'test-value', { PX: 1000 })
    })
  })

  describe('increment', () => {
    it('should call client.eval with the increment script', async () => {
      mockClient.eval.mockResolvedValue('1')
      const result = await storage.increment('test-key', 1000)
      expect(mockClient.eval).toHaveBeenCalledWith(expect.any(String), {
        keys: ['test-key'],
        arguments: ['1000'],
      })
      expect(result).toBe(1)
    })
  })

  describe('addTimestamp', () => {
    it('should call client.zAdd with the correct arguments', async () => {
      const timestamp = Date.now()
      await storage.addTimestamp('test-id', timestamp, 5000)
      expect(mockClient.zAdd).toHaveBeenCalledWith('test-id', {
        score: timestamp,
        value: timestamp.toString(),
      })
      expect(mockClient.pExpire).toHaveBeenCalledWith('test-id', 5000)
    })
  })

  describe('countTimestamps', () => {
    it('should call client.zCount with the correct window', async () => {
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)
      
      await storage.countTimestamps('test-id', 60000)
      expect(mockClient.zCount).toHaveBeenCalledWith('test-id', now - 60000, now)

      vi.restoreAllMocks()
    })
  })
})
