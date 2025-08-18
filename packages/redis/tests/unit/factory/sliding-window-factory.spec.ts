import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSlidingWindowLimiter } from '../../../src/factory/strategies/sliding-window-factory'
import { RateLimiter } from '../../../src/limiter/index'
import { RedisStorageError } from '../../../src/utils/errors'

const mockClient = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    isOpen: true,
    on: vi.fn(),
    eval: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    pTTL: vi.fn(),
    pExpire: vi.fn(),
    keys: vi.fn(),
    type: vi.fn(),
    zCard: vi.fn(),
    hGet: vi.fn(),
    ping: vi.fn(),
    quit: vi.fn(),
    script: vi.fn(),
    multi: vi.fn(() => ({
        get: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        eval: vi.fn().mockReturnThis(),
        exec: vi.fn(),
    })),
}

vi.mock('redis', () => ({
    createClient: vi.fn(() => mockClient),
}))

describe('Sliding Window Factory', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockClient.connect.mockResolvedValue(undefined)
        mockClient.eval.mockResolvedValue('1')
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('createSlidingWindowLimiter', () => {
        it('should create sliding window rate limiter', async () => {
            const { limiter, storage } = await createSlidingWindowLimiter({
                strategy: { limit: 10, windowMs: 60000 },
                storage: {
                    redisOptions: 'redis://localhost:6379',
                },
            })
            expect(limiter).toBeDefined()
            expect(storage).toBeDefined()
            expect(limiter).toBeInstanceOf(RateLimiter)
        })

        it('should throw RedisStorageError on creation failure', async () => {
            mockClient.connect.mockRejectedValue(new Error('Connection failed'))
            await expect(
                createSlidingWindowLimiter({
                    strategy: { limit: 10, windowMs: 60000 },
                    storage: {
                        redisOptions: 'redis://localhost:6379',
                    },
                })
            ).rejects.toThrow(RedisStorageError)
        })
    })
})
