# @ratelock/redis

Redis storage backend for the RateLock rate limiting system.

## Overview

`@ratelock/redis` is a Redis-based storage implementation for RateLock, providing persistent and scalable rate limiting capabilities. It implements the Storage interface from `@ratelock/core` and supports all rate limiting strategies including fixed window, sliding window, and token bucket.

## Features

- **Persistent Storage**: Uses Redis for durable rate limiting state
- **High Performance**: Optimized Lua scripts for atomic operations
- **Multiple Strategies**: Supports all RateLock rate limiting strategies
- **Batch Operations**: Pipeline support for efficient batch processing
- **Connection Management**: Automatic reconnection and error handling
- **TypeScript Support**: Full TypeScript definitions included

## Installation

```bash
npm install @ratelock/redis
```

## Quick Start

```typescript
import { createFixedWindowLimiter } from '@ratelock/redis'

// Create a rate limiter with Redis storage
const { limiter, close } = await createFixedWindowLimiter({
  strategy: {
    limit: 100,
    windowMs: 60000, // 1 minute
  },
  storage: {
    redis: 'redis://localhost:6379',
    keyPrefix: 'api:',
  },
  prefix: 'user-rate-limit',
})

// Check if a request is allowed
const result = await limiter.check('user123')
if (result.allowed) {
  console.log('Request allowed')
} else {
  console.log('Rate limit exceeded')
}

// Close the connection when done
await close()
```

## Configuration

### Storage Configuration

```typescript
interface RedisStorageConfig {
  /** Redis connection URL or options */
  redis: string | RedisClientOptions
  
  /** Key prefix for all Redis keys */
  keyPrefix?: string
  
  /** Enable debug logging */
  debug?: boolean
  
  /** Maximum number of retry attempts */
  maxRetries?: number
  
  /** Delay between retry attempts in milliseconds */
  retryDelay?: number
}
```

### Strategy Configuration

All RateLock strategies are supported:

- **Fixed Window**: `createFixedWindowLimiter`
- **Sliding Window**: `createSlidingWindowLimiter`
- **Token Bucket**: `createTokenBucketLimiter`
- **Individual Fixed Window**: `createIndividualFixedWindowLimiter`

## Lua Scripts

The package uses optimized Lua scripts for atomic operations:

- `FIXED_WINDOW_INCREMENT`: Atomic increment with limit checking
- `SLIDING_WINDOW_ADD_REQUEST`: Add request to sliding window
- `TOKEN_BUCKET_CONSUME`: Consume token from bucket
- `GET_CURRENT`: Get current value/count
- `RESET_KEY`: Reset a key
- `GET_TTL`: Get TTL for a key

## Error Handling

The package includes comprehensive error handling:

- Automatic reconnection on connection loss
- Retry mechanism for failed operations
- Detailed error reporting with context

## API

### Storage Methods

- `increment(key: string, windowMs: number, limit: number)`: Increment counter for fixed window
- `addRequest(key: string, windowMs: number, limit: number)`: Add request for sliding window
- `consumeToken(key: string, capacity: number, refillRate: number)`: Consume token for token bucket
- `getCurrent(key: string)`: Get current count/value
- `reset(key: string)`: Reset a key
- `getTTL(key: string)`: Get TTL for a key
- `getKeysByPattern(pattern: string)`: Get keys by pattern
- `deleteKeysByPattern(pattern: string)`: Delete keys by pattern
- `getPipeline()`: Get pipeline for batch operations
- `isHealthy()`: Check if Redis connection is healthy
- `close()`: Close Redis connection

### Pipeline Methods

- `increment(key: string, windowMs: number, limit: number)`: Add increment operation
- `addRequest(key: string, windowMs: number, limit: number)`: Add addRequest operation
- `consumeToken(key: string, capacity: number, refillRate: number)`: Add consumeToken operation
- `reset(key: string)`: Add reset operation
- `getCurrent(key: string)`: Add getCurrent operation
- `execute()`: Execute all commands
- `executeInBatches(batchSize: number)`: Execute commands in batches

## Examples

See the [examples](./examples) directory for more usage examples.

## License

MIT