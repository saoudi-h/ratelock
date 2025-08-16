import type { StorageConfig } from ".";

/**
 * Default storage configurations for rate limiting
 * - local: In-memory storage with standard cleanup settings
 * - redis: Redis storage with playground namespace prefix
 */
export const DEFAULT_STORAGE_CONFIGS: {
    local: StorageConfig,
    redis: StorageConfig
} = {
    local: {
        type: 'local',
        config: {
            cleanupIntervalMs: 1000,
            cleanupRequestThreshold: 1000,
        }
    },
    redis: {
        type: 'redis',
        config: {
            url: undefined,  // Will be filled server-side
            keyPrefix: 'playground:',
        }
    },
};
