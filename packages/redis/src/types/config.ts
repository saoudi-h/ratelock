/**
 * Configuration interfaces for Redis storage
 */

/**
 * Redis storage configuration
 */
export interface RedisStorageConfig {
  /** Redis client instance */
  client: any // RedisClientType
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
  redis?: string | any // RedisClientOptions
  /** Key prefix for all Redis keys */
  keyPrefix?: string
  /** Enable debug logging */
  debug?: boolean
}