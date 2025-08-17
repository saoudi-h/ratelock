import {
    createFixedWindowLimiter,
    createIndividualFixedWindowLimiter,
    createSlidingWindowLimiter,
    createTokenBucketLimiter,
} from '../src/index'

/**
 * Demonstrates basic fixed window rate limiting
 * - Allows 5 requests per 60-second window
 * - Shows request allowance pattern
 */
async function basicFixedWindowExample() {
    console.log('=== Basic Fixed Window Example ===')
    const { limiter } = await createFixedWindowLimiter({
        strategy: { limit: 5, windowMs: 60000 },
        storage: { cleanupIntervalMs: 1000, cleanupRequestThreshold: 1000 },
    })

    const userId = 'user123'
    for (let i = 1; i <= 7; i++) {
        const result = await limiter.check(userId)
        console.log(
            `Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.remaining ?? 'N/A'} remaining)`
        )
    }
}

/**
 * Shows individual fixed window behavior
 * - Window starts at first request
 * - 3 requests per 10-second window
 * - Includes 2-second delay between requests
 */
async function individualFixedWindowExample() {
    console.log('\n=== Individual Fixed Window Example ===')
    const { limiter } = await createIndividualFixedWindowLimiter({
        strategy: { limit: 3, windowMs: 10000 },
        storage: { cleanupIntervalMs: 1000, cleanupRequestThreshold: 1000 },
    })

    const userId = 'user456'
    for (let i = 1; i <= 5; i++) {
        const result = await limiter.check(userId)
        console.log(
            `Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.remaining ?? 'N/A'} remaining)`
        )
        await new Promise(resolve => setTimeout(resolve, 2000))
    }
}

/**
 * Illustrates sliding window algorithm
 * - 4 requests per 10-second window
 * - 1.5-second delay between requests
 * - Shows smoother rate limiting than fixed window
 */
async function slidingWindowExample() {
    console.log('\n=== Sliding Window Example ===')
    const { limiter } = await createSlidingWindowLimiter({
        strategy: { limit: 4, windowMs: 10000 },
        storage: { cleanupIntervalMs: 1000, cleanupRequestThreshold: 1000 },
    })

    const userId = 'user789'
    for (let i = 1; i <= 6; i++) {
        const result = await limiter.check(userId)
        console.log(
            `Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.remaining ?? 'N/A'} remaining)`
        )
        await new Promise(resolve => setTimeout(resolve, 1500))
    }
}

/**
 * Token bucket algorithm demonstration
 * - Capacity of 3 tokens
 * - Refills at 0.5 tokens per second (1 token every 2 seconds)
 * - Shows gradual token replenishment
 */
async function tokenBucketExample() {
    console.log('\n=== Token Bucket Example ===')
    const { limiter } = await createTokenBucketLimiter({
        strategy: {
            capacity: 3,
            refillRate: 0.5,
            refillTime: 2000,
        },
        storage: { cleanupIntervalMs: 1000, cleanupRequestThreshold: 1000 },
    })

    const userId = 'user101'
    for (let i = 1; i <= 5; i++) {
        const result = await limiter.check(userId)
        console.log(
            `Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.tokens ?? 'N/A'} tokens remaining)`
        )
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
}

/**
 * Custom storage configuration example
 * - 10 requests per 30-second window
 * - More aggressive cleanup settings
 */
async function customStorageExample() {
    console.log('\n=== Custom Storage Configuration Example ===')
    const { limiter } = await createFixedWindowLimiter({
        strategy: { limit: 10, windowMs: 30000 },
        storage: {
            cleanupIntervalMs: 500,
            cleanupRequestThreshold: 500,
        },
    })

    const userId = 'user202'
    for (let i = 1; i <= 12; i++) {
        const result = await limiter.check(userId)
        console.log(
            // TODO: infer return type from strategy
            `Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.remaining ?? 'N/A'} remaining)`
        )
    }
}

/**
 * Executes all rate limiting examples sequentially
 * @throws Will log any errors encountered during execution
 */
async function runExamples() {
    try {
        await basicFixedWindowExample()
        await individualFixedWindowExample()
        await slidingWindowExample()
        await tokenBucketExample()
        await customStorageExample()
        console.log('\n=== All examples completed successfully! ===')
    } catch (error) {
        console.error('Error running examples:', error)
    }
}

// Export examples for testing or modular use
export {
    basicFixedWindowExample,
    customStorageExample,
    individualFixedWindowExample,
    runExamples,
    slidingWindowExample,
    tokenBucketExample,
}

// Self-executing block when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runExamples()
}
