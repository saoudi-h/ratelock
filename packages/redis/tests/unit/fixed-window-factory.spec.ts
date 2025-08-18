import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRedisStorage } from '../../src/factory/storage-factory'
import { createFixedWindowLimiter } from '../../src/factory/strategies/fixed-window-factory'
import { RedisStorageError } from '../../src/utils/errors'

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

describe('Factory Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockClient.connect.mockResolvedValue(undefined)
        mockClient.eval.mockResolvedValue('1')
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('createRedisStorage', () => {
        it('should create Redis storage with string URL', async () => {
            const storage = await createRedisStorage({
                redisOptions: 'redis://localhost:6379',
            })

            expect(storage).toBeDefined()
            expect(storage).toHaveProperty('get')
            expect(storage).toHaveProperty('set')
            expect(storage).toHaveProperty('increment')
            expect(mockClient.connect).toHaveBeenCalled()
        })

        it('should throw RedisStorageError on connection failure', async () => {
            const connectionError = new Error('Connection failed')
            mockClient.connect.mockRejectedValue(connectionError)

            await expect(
                createRedisStorage({
                    redisOptions: 'redis://localhost:6379',
                })
            ).rejects.toThrow(RedisStorageError)

            await expect(
                createRedisStorage({
                    redisOptions: 'redis://localhost:6379',
                })
            ).rejects.toThrow('Failed to connect to Redis')
        })
    })

    describe('createFixedWindowLimiter', () => {
        it('should create fixed window rate limiter', async () => {
            const { limiter, storage } = await createFixedWindowLimiter({
                strategy: { limit: 10, windowMs: 60000 },
                storage: {
                    redisOptions: 'redis://localhost:6379',
                },
            })

            expect(limiter).toBeDefined()
            expect(storage).toBeDefined()
        })

        it('should throw RedisStorageError on creation failure', async () => {
            mockClient.connect.mockRejectedValue(new Error('Connection failed'))

            await expect(
                createFixedWindowLimiter({
                    strategy: { limit: 10, windowMs: 60000 },
                    storage: {
                        redisOptions: 'redis://localhost:6379',
                    },
                })
            ).rejects.toThrow(RedisStorageError)
        })
    })
})
