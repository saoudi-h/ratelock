import { RateLimiter } from '@ratelock/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRedisStorage } from '../../src/factory/storage-factory'
import { createFixedWindowLimiter } from '../../src/factory/strategies/fixed-window-factory'
import { RedisStorageError } from '../../src/utils/errors'

// Mock Redis client
const mockClient = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    isOpen: true,
    on: vi.fn(),
    eval: vi.fn(),
    get: vi.fn(),
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
    multi: vi.fn(),
}

// Mock createClient function
vi.mock('redis', () => ({
    createClient: vi.fn(() => mockClient),
}))

describe('Factory Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.resetAllMocks()
    })

    describe('createRedisStorage', () => {
        it('should create Redis storage with string URL', async () => {
            mockClient.connect.mockResolvedValue(undefined)

            const storage = await createRedisStorage({
                redisOptions: 'redis://localhost:6379',
            })

            expect(storage).toBeDefined()
            expect(mockClient.connect).toHaveBeenCalled()
        })

        it('should create Redis storage with options object', async () => {
            mockClient.connect.mockResolvedValue(undefined)

            const storage = await createRedisStorage({
                redisOptions: { url: 'redis://localhost:6379' },
            })

            expect(storage).toBeDefined()
            expect(mockClient.connect).toHaveBeenCalled()
        })

        it('should throw RedisStorageError on connection failure', async () => {
            mockClient.connect.mockRejectedValue(new Error('Connection failed'))

            await expect(
                createRedisStorage({
                    redisOptions: 'redis://localhost:6379',
                })
            ).rejects.toThrow(RedisStorageError)
        })
    })

    describe('createFixedWindowLimiter', () => {
        it('should create fixed window rate limiter', async () => {
            mockClient.connect.mockResolvedValue(undefined)
            mockClient.eval.mockResolvedValue('1') // Mock increment script

            const { limiter, storage } = await createFixedWindowLimiter({
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
