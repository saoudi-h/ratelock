import { createClient, type RedisClientOptions } from 'redis'
import { StorageService } from '../storage/storage.service'
import { RedisStorageError } from '../utils/errors'
import type { RedisStorage } from 'storage/redis-storage.interface'

/**
 * Configuration for the Redis storage factory.
 */
export interface RedisStorageConfig {
  /**
   * Redis client options, as defined by 'redis' package.
   * Can be a connection string or an options object.
   * @see https://github.com/redis/node-redis/blob/master/docs/client-configuration.md
   */
  redisOptions: RedisClientOptions | string
}

/**
 * Factory function to create a Redis storage service instance.
 * It creates a new Redis client, connects it, and returns a StorageService.
 *
 * @param config - Configuration options for the Redis storage service.
 * @returns A new instance of StorageService connected to Redis.
 */
export async function createRedisStorage(config: RedisStorageConfig): Promise<RedisStorage> {
  const client = typeof config.redisOptions === 'string'
    ? createClient({ url: config.redisOptions })
    : createClient(config.redisOptions);

  // Handle connection errors
  client.on('error', (err) => console.error('Redis Client Error', err));

  try {
    await client.connect();
  } catch (err) {
    throw new RedisStorageError('Failed to connect to Redis', { cause: err });
  }

  return new StorageService(client as any);
}
