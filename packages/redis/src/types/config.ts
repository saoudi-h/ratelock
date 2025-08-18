/**
 * Configuration interfaces for Redis storage
 */

import type { RedisClientOptions, RedisClientType } from './redis'

/**
 * Redis storage configuration
 */
export interface RedisStorageConfig {
    /** Redis client instance */
    client: RedisClientType
    /** Key prefix for all Redis keys */
    keyPrefix?: string
    /** Enable debug logging */
    debug?: boolean
}

/**
 * Redis storage factory configuration
 */
export interface RedisStorageFactoryConfig {
    /** Redis connection URL or options */
    redis?: string | RedisClientOptions
    /** Key prefix for all Redis keys */
    keyPrefix?: string
    /** Enable debug logging */
    debug?: boolean
}
