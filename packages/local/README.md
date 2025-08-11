# @ratelock/local

A high-performance, in-memory rate limiting package for Node.js applications. This package provides fast, single-instance rate limiting without external dependencies.

## Features

- 🚀 **High Performance**: In-memory storage for maximum speed
- 🧹 **Automatic Cleanup**: Built-in cleanup of expired entries
- 🔧 **Multiple Strategies**: Fixed Window, Individual Fixed Window, Sliding Window, and Token Bucket
- 📦 **Zero Dependencies**: No external storage dependencies
- 🎯 **TypeScript**: Full TypeScript support with strict typing
- 🔄 **Core Compatible**: Uses the same strategies as @ratelock/core

## Installation

```bash
npm install @ratelock/local
```

## Quick Start

```typescript
import { LocalRateLimiter } from '@ratelock/local'
import { FixedWindow } from '@ratelock/local/strategy'

// Create a rate limiter with Fixed Window strategy
const limiter = new LocalRateLimiter(s =>
    FixedWindow({ limit: 100, windowMs: 60000 }).withStorage(s)
)

// Check if a request is allowed
const result = await limiter.check('user123')
console.log(result.allowed ? 'Request allowed' : 'Rate limited')
```

## Usage

### Basic Rate Limiting

```typescript
import { LocalRateLimiter } from '@ratelock/local'
import { FixedWindow } from '@ratelock/local/strategy'

const limiter = new LocalRateLimiter(s =>
    FixedWindow({
        limit: 10, // 10 requests
        windowMs: 60000, // per minute
    }).withStorage(s)
)

// Check rate limit
const result = await limiter.check('user123')
if (result.allowed) {
    // Process request
    console.log(`Request allowed. ${result.remaining} requests remaining.`)
} else {
    // Rate limited
    console.log(`Rate limited. Reset at ${new Date(result.reset)}`)
}
```

### Different Strategies

#### Fixed Window

```typescript
import { FixedWindow } from '@ratelock/local/strategy'

const limiter = new LocalRateLimiter(s =>
    FixedWindow({ limit: 100, windowMs: 60000 }).withStorage(s)
)
```

#### Individual Fixed Window

```typescript
import { IndividualFixedWindow } from '@ratelock/local/strategy'

const limiter = new LocalRateLimiter(s =>
    IndividualFixedWindow({ limit: 50, windowMs: 30000 }).withStorage(s)
)
```

#### Sliding Window

```typescript
import { SlidingWindowBuilder } from '@ratelock/local/strategy'

const limiter = new LocalRateLimiter(s =>
    SlidingWindowBuilder({ limit: 200, windowMs: 60000 }).withStorage(s)
)
```

#### Token Bucket

```typescript
import { TokenBucket } from '@ratelock/local/strategy'

const limiter = new LocalRateLimiter(s =>
    TokenBucket({
        capacity: 10, // 10 tokens
        refillRate: 1, // 1 token per second
        refillTime: 1000, // refill every second
    }).withStorage(s)
)
```

### Custom Configuration

```typescript
const limiter = new LocalRateLimiter(
    s => FixedWindow({ limit: 100, windowMs: 60000 }).withStorage(s),
    {
        enableCleanup: true, // Enable automatic cleanup (default: true)
        cleanupIntervalMs: 5000, // Cleanup every 5 seconds (default: 1000)
    }
)

// Stop cleanup when done
limiter.stopCleanup()
```

### Batch Operations

```typescript
// Check multiple identifiers at once
const results = await limiter.checkBatch(['user1', 'user2', 'user3'])
results.forEach((result, index) => {
    console.log(`User ${index + 1}: ${result.allowed ? 'Allowed' : 'Denied'}`)
})
```

## API Reference

### LocalRateLimiter

#### Constructor

```typescript
new LocalRateLimiter(
    strategyFactory: StrategyFactory,
    options?: LocalRateLimiterOptions
)
```

#### Methods

- `check(identifier: string): Promise<RateLimitResult>` - Check if a request is allowed
- `checkBatch(identifiers: string[]): Promise<RateLimitResult[]>` - Check multiple identifiers
- `stopCleanup(): void` - Stop the automatic cleanup task
- `getStorageService(): StorageService` - Get the underlying storage service

### LocalRateLimiterOptions

```typescript
interface LocalRateLimiterOptions {
    enableCleanup?: boolean // Enable automatic cleanup (default: true)
    cleanupIntervalMs?: number // Cleanup interval in milliseconds (default: 1000)
}
```

### StorageService

The underlying storage service provides these methods:

- `get(key: string): Promise<string | null>`
- `set(key: string, value: string, ttlMs?: number): Promise<void>`
- `delete(key: string): Promise<void>`
- `exists(key: string): Promise<boolean>`
- `increment(key: string, ttlMs?: number): Promise<number>`
- `incrementIf(key: string, maxValue: number, ttlMs?: number): Promise<{ value: number; incremented: boolean }>`
- `decrement(key: string, minValue?: number): Promise<number>`
- `addTimestamp(identifier: string, timestamp: number, ttlMs: number): Promise<void>`
- `countTimestamps(identifier: string, windowMs: number): Promise<number>`
- `getOldestTimestamp(identifier: string): Promise<number | null>`
- `cleanupTimestamps(identifier: string): Promise<void>`
- `multiGet(keys: string[]): Promise<(string | null)[]>`
- `multiSet(entries: Array<{ key: string; value: string; ttlMs?: number }>): Promise<void>`
- `pipeline(): StoragePipeline`
- `expire(keyOrIdentifier: string, ttlMs: number): Promise<void>`

## Performance

The local package is optimized for high-performance scenarios:

- **Memory Efficient**: Automatic cleanup of expired entries
- **Fast Access**: In-memory Map-based storage
- **Batch Operations**: Support for checking multiple identifiers at once
- **Configurable Cleanup**: Adjustable cleanup intervals

## Use Cases

- **API Rate Limiting**: Protect your APIs from abuse
- **User Authentication**: Limit login attempts
- **Form Submissions**: Prevent spam submissions
- **File Uploads**: Control upload frequency
- **Single-Instance Applications**: When you don't need distributed rate limiting

## Examples

See the [examples](./examples/basic-usage.ts) directory for complete usage examples.

## License

MIT
