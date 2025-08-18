import type { Storage } from '@ratelock/core/storage'
import { StorageService } from '../storage/storage.service'

/**
 * Configuration options for the local storage service.
 */
export interface StorageConfig {
    /**
     * The interval in milliseconds for automatic cleanup of expired entries.
     * Defaults to 1000ms.
     */
    cleanupIntervalMs?: number

    /**
     * The number of requests after which automatic cleanup is triggered.
     * Defaults to 1000 requests.
     */
    cleanupRequestThreshold?: number
}

/**
 * Factory function to create a local storage service instance.
 *
 * @param config - Configuration options for the local storage service
 * @returns A new instance of StorageService
 */
export function createStorage(config?: StorageConfig): Storage {
    const storage = new StorageService()

    if (config?.cleanupIntervalMs !== undefined) {
        storage.setCleanupInterval(config.cleanupIntervalMs)
    }

    if (config?.cleanupRequestThreshold !== undefined) {
        storage.setCleanupRequestThreshold(config.cleanupRequestThreshold)
    }

    return storage
}
