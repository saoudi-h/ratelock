import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRedisStorage } from '../../../src/factory/storage-factory'
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

describe('RedisStorageFactory', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockClient.connect.mockResolvedValue(undefined)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should create Redis storage with a connection string', async () => {
        const storage = await createRedisStorage({
            redisOptions: 'redis://localhost:6379',
        })

        expect(storage).toBeDefined()
        expect(storage).toHaveProperty('get')
        expect(storage).toHaveProperty('set')
        expect(storage).toHaveProperty('increment')
        expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should create Redis storage with an options object', async () => {
        const storage = await createRedisStorage({
            redisOptions: {
                socket: {
                    host: 'localhost',
                    port: 6379,
                },
            },
        })

        expect(storage).toBeDefined()
    })

    it('should handle connection errors gracefully', async () => {
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
