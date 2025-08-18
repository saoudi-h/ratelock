import { storageContract } from '@ratelock/test-utils/contracts'
import { createClient } from 'redis'
import { afterAll, beforeAll, describe } from 'vitest'
import { StorageService } from '../../src/storage/storage.service'

describe('RedisStorage Contract', () => {
    let storage: StorageService | null = null
    let client: ReturnType<typeof createClient> | null = null

    beforeAll(async () => {
        // Create Redis client
        client = createClient({
            url: process.env.REDIS_URL,
        })

        await client.connect()
        await client.flushDb()

        // Create Redis storage
        storage = new StorageService(client)
    })

    afterAll(async () => {
        if (client) {
            await client.quit()
        }
    })

    // Run the storage contract tests
    storageContract(() => storage!)
})
