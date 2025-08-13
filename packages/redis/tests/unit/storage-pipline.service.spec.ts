import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StoragePipelineService } from '../../src/storage/storage-pipline.service'
import type { RedisClientMultiCommand } from '@redis/client/dist/lib/client/multi-command'

const mockMulti = {
  get: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  pExpire: vi.fn().mockReturnThis(),
  zAdd: vi.fn().mockReturnThis(),
  zCount: vi.fn().mockReturnThis(),
  zRangeWithScores: vi.fn().mockReturnThis(),
  exec: vi.fn(),
}

describe('StoragePipelineService', () => {
  let pipeline: StoragePipelineService
  let multi: unknown

  beforeEach(() => {
    multi = mockMulti
    pipeline = new StoragePipelineService(multi as RedisClientMultiCommand)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should chain commands correctly', async () => {
    await pipeline.get('key1')
    await pipeline.set('key2', 'value2')
    await pipeline.expire('key3', 1000)

    expect(mockMulti.get).toHaveBeenCalledWith('key1')
    expect(mockMulti.set).toHaveBeenCalledWith('key2', 'value2')
    expect(mockMulti.pExpire).toHaveBeenCalledWith('key3', 1000)
  })

  it('should call exec on the multi object', async () => {
    mockMulti.exec.mockResolvedValue(['OK', 'OK'])
    const results = await pipeline.exec()
    expect(mockMulti.exec).toHaveBeenCalled()
    expect(results).toEqual(['OK', 'OK'])
  })

  it('should handle set with TTL', async () => {
    await pipeline.set('key', 'value', 2000)
    expect(mockMulti.set).toHaveBeenCalledWith('key', 'value', { PX: 2000 })
  })

  it('should handle addTimestamp', async () => {
    const timestamp = Date.now()
    await pipeline.addTimestamp('id', timestamp, 5000)
    expect(mockMulti.zAdd).toHaveBeenCalledWith('id', { score: timestamp, value: timestamp.toString() })
    expect(mockMulti.pExpire).toHaveBeenCalledWith('id', 5000)
  })

  it('should warn when using unsupported commands', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await pipeline.increment('key')
    expect(warnSpy).toHaveBeenCalledWith('Pipelining custom LUA scripts like "increment" is not supported in this version.')
    warnSpy.mockRestore()
  })
})
