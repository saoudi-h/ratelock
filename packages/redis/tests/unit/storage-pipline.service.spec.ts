import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DECREMENT, INCREMENT, INCREMENT_IF } from '../../src/lua-scripts'
import { StoragePipelineService } from '../../src/storage/storage-pipline.service'

const mockMulti = {
    get: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    pExpire: vi.fn().mockReturnThis(),
    eval: vi.fn().mockReturnThis(),
    zAdd: vi.fn().mockReturnThis(),
    zCount: vi.fn().mockReturnThis(),
    zRangeWithScores: vi.fn().mockReturnThis(),
    exec: vi.fn(),
}

describe('StoragePipelineService', () => {
    let pipeline: StoragePipelineService

    beforeEach(() => {
        pipeline = new StoragePipelineService(mockMulti as any)
        vi.clearAllMocks()
    })

    /* ---------- Simple Key/Value ---------- */
    it('should queue GET', () => {
        pipeline.get('myKey')
        expect(mockMulti.get).toHaveBeenCalledWith('myKey')
    })

    it('should queue SET without TTL', () => {
        pipeline.set('k', 'v')
        expect(mockMulti.set).toHaveBeenCalledWith('k', 'v', undefined)
    })

    it('should queue SET with TTL', () => {
        pipeline.set('k', 'v', 1500)
        expect(mockMulti.set).toHaveBeenCalledWith('k', 'v', { PX: 1500 })
    })

    it('should queue EXPIRE', () => {
        pipeline.expire('foo', 3000)
        expect(mockMulti.pExpire).toHaveBeenCalledWith('foo', 3000)
    })

    /* ---------- Lua Counter Operations ---------- */
    it('should queue INCREMENT with TTL', () => {
        pipeline.increment('counter', 2000)
        expect(mockMulti.eval).toHaveBeenCalledWith(INCREMENT, {
            keys: ['counter'],
            arguments: ['2000'],
        })
    })

    it('should queue INCREMENT without TTL', () => {
        pipeline.increment('counter')
        expect(mockMulti.eval).toHaveBeenCalledWith(INCREMENT, {
            keys: ['counter'],
            arguments: ['0'],
        })
    })

    it('should queue INCREMENT-IF', () => {
        pipeline.incrementIf('key', 10, 5000)
        expect(mockMulti.eval).toHaveBeenCalledWith(INCREMENT_IF, {
            keys: ['key'],
            arguments: ['10', '5000'],
        })
    })

    it('should queue DECREMENT with custom min', () => {
        pipeline.decrement('dec', -5)
        expect(mockMulti.eval).toHaveBeenCalledWith(DECREMENT, {
            keys: ['dec'],
            arguments: ['-5'],
        })
    })

    it('should queue DECREMENT with default min (0)', () => {
        pipeline.decrement('dec')
        expect(mockMulti.eval).toHaveBeenCalledWith(DECREMENT, {
            keys: ['dec'],
            arguments: ['0'],
        })
    })

    /* ---------- Sorted-set timestamps ---------- */
    it('should queue addTimestamp', () => {
        const ts = 1_686_000_000_000
        pipeline.addTimestamp('id', ts, 4000)
        expect(mockMulti.zAdd).toHaveBeenCalledWith('id', {
            score: ts,
            value: ts.toString(),
        })
        expect(mockMulti.pExpire).toHaveBeenCalledWith('id', 4000)
    })

    it('should queue countTimestamps', () => {
        const now = Date.now()
        vi.spyOn(Date, 'now').mockReturnValue(now)
        pipeline.countTimestamps('id', 10000)
        expect(mockMulti.zCount).toHaveBeenCalledWith('id', now - 10000, now)
    })

    it('should queue getOldestTimestamp', () => {
        pipeline.getOldestTimestamp('id')
        expect(mockMulti.zRangeWithScores).toHaveBeenCalledWith('id', 0, 0)
    })

    it('should return exec results', async () => {
        mockMulti.exec.mockResolvedValue(['OK', 5, ['result']])
        const res = await pipeline.exec()
        expect(mockMulti.exec).toHaveBeenCalled()
        expect(res).toEqual(['OK', 5, ['result']])
    })

    /* ---------- Chaining ---------- */
    it('supports fluent chaining', () => {
        const chained = pipeline.get('a').set('b', 'B').increment('c').addTimestamp('d', 1234, 1000)

        expect(chained).toBe(pipeline)
        expect(mockMulti.get).toHaveBeenCalledWith('a')
        expect(mockMulti.set).toHaveBeenCalledWith('b', 'B', undefined)
        expect(mockMulti.eval).toHaveBeenCalledWith(INCREMENT, {
            keys: ['c'],
            arguments: ['0'],
        })
        expect(mockMulti.zAdd).toHaveBeenCalled()
        expect(mockMulti.pExpire).toHaveBeenCalledWith('d', 1000)
    })
})
