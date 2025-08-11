import { 
  createFixedWindowLimiter, 
  createSlidingWindowLimiter, 
  createTokenBucketLimiter,
  createIndividualFixedWindowLimiter
} from '../src/index'

// Example 1: Basic Fixed Window Rate Limiting
async function basicFixedWindowExample() {
    console.log('=== Basic Fixed Window Example ===')

    const { limiter } = await createFixedWindowLimiter({
      strategy: { limit: 5, windowMs: 60000 },
      storage: { cleanupIntervalMs: 1000, cleanupRequestThreshold: 1000 }
    })

    const userId = 'user123'

    for (let i = 1; i <= 7; i++) {
        const result: any = await limiter.check(userId)
        console.log(
            `Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.remaining !== undefined ? result.remaining : 'N/A'} remaining)`
        )
    }
}

// Example 2: Individual Fixed Window (starts window at first request)
async function individualFixedWindowExample() {
    console.log('\n=== Individual Fixed Window Example ===')

    const { limiter } = await createIndividualFixedWindowLimiter({
      strategy: { limit: 3, windowMs: 10000 },
      storage: { cleanupIntervalMs: 1000, cleanupRequestThreshold: 1000 }
    })

    const userId = 'user456'

    for (let i = 1; i <= 5; i++) {
        const result: any = await limiter.check(userId)
        console.log(
            `Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.remaining !== undefined ? result.remaining : 'N/A'} remaining)`
        )
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
    }
}

// Example 3: Sliding Window Rate Limiting
async function slidingWindowExample() {
    console.log('\n=== Sliding Window Example ===')

    const { limiter } = await createSlidingWindowLimiter({
      strategy: { limit: 4, windowMs: 10000 },
      storage: { cleanupIntervalMs: 1000, cleanupRequestThreshold: 1000 }
    })

    const userId = 'user789'

    for (let i = 1; i <= 6; i++) {
        const result: any = await limiter.check(userId)
        console.log(
            `Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.remaining !== undefined ? result.remaining : 'N/A'} remaining)`
        )
        await new Promise(resolve => setTimeout(resolve, 1500)) // Wait 1.5 seconds
    }
}

// Example 4: Token Bucket Rate Limiting
async function tokenBucketExample() {
    console.log('\n=== Token Bucket Example ===')

    const { limiter } = await createTokenBucketLimiter({
      strategy: {
        capacity: 3,
        refillRate: 0.5, // 1 token every 2 seconds
        refillTime: 2000,
      },
      storage: { cleanupIntervalMs: 1000, cleanupRequestThreshold: 1000 }
    })

    const userId = 'user101'

    for (let i = 1; i <= 5; i++) {
        const result: any = await limiter.check(userId)
        console.log(
            `Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.tokens !== undefined ? result.tokens : 'N/A'} tokens remaining)`
        )
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    }
}

// Example 5: Custom Storage Configuration
async function customStorageExample() {
    console.log('\n=== Custom Storage Configuration Example ===')

    const { limiter } = await createFixedWindowLimiter({
      strategy: { limit: 10, windowMs: 30000 },
      storage: { 
        cleanupIntervalMs: 500, 
        cleanupRequestThreshold: 500 
      }
    })

    const userId = 'user202'

    for (let i = 1; i <= 12; i++) {
        const result: any = await limiter.check(userId)
        console.log(
            `Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.remaining !== undefined ? result.remaining : 'N/A'} remaining)`
        )
    }
}

// Run all examples
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

// Export for use in tests or other modules
export {
    basicFixedWindowExample,
    customStorageExample,
    individualFixedWindowExample,
    runExamples,
    slidingWindowExample,
    tokenBucketExample,
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runExamples()
}
