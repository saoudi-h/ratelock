import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRedisStorage } from '../../../src/factory/storage-factory'
import { RedisStorageError } from '../../../src/utils/errors'

// Mock the 'redis' module
const mockClient = {
    connect: vi.fn(),
    quit: vi.fn(),
    on: vi.fn(),
}
vi.mock('redis', () => ({
    createClient: vi.fn(() => mockClient),
}))

describe('RedisStorageFactory', () => {
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks()
        mockClient.connect.mockReset()
        mockClient.quit.mockReset()
        mockClient.on.mockReset()
    })

    it('should create Redis storage with a connection string', async () => {
        mockClient.connect.mockResolvedValue(undefined)
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
        mockClient.connect.mockResolvedValue(undefined)
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
