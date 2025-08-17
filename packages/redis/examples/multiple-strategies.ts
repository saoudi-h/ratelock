import { config } from 'dotenv'
import { createSlidingWindowLimiter, createTokenBucketLimiter } from '../src/factory'
import { createFixedWindowLimiter } from '../src/factory/strategies/fixed-window-factory'
import { createIndividualFixedWindowLimiter } from '../src/factory/strategies/individual-fixed-window-factory'
import { isAllowed, line, title } from './utils/draw'
import { withDocker } from './utils/withDocker'

config({ path: '../.env.test' })

/**
 * Tests fixed window rate limiting strategy
 * - 3 requests per 10-second window
 * - Tests 7 consecutive requests with 1-second intervals
 * - Demonstrates window reset behavior
 */
async function testFixedWindow() {
    line()
    title('Testing Fixed Window Strategy...')

    const { limiter } = await createFixedWindowLimiter({
        strategy: { limit: 3, windowMs: 10000 },
        storage: { redisOptions: process.env.REDIS_URL },
    })

    for (let i = 0; i < 7; i++) {
        const result = await limiter.check('user123')
        isAllowed(`Request ${i + 1}:`, result.allowed)
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
}

/**
 * Tests sliding window rate limiting strategy
 * - 3 requests per 10-second window
 * - Tests 5 requests with 1.5-second intervals
 * - Demonstrates smoother rate limiting than fixed window
 */
async function testSlidingWindow() {
    title('Testing Sliding Window Strategy...')

    const { limiter } = await createSlidingWindowLimiter({
        strategy: { limit: 3, windowMs: 10000 },
        storage: { redisOptions: process.env.REDIS_URL },
    })

    for (let i = 0; i < 5; i++) {
        const result = await limiter.check('user123')
        isAllowed(`Request ${i + 1}:`, result.allowed)
        await new Promise(resolve => setTimeout(resolve, 1500))
    }
}

/**
 * Tests token bucket rate limiting strategy
 * - 5 token capacity
 * - Refills at 2 tokens per second
 * - Tests 15 rapid requests (200ms intervals)
 * - Demonstrates token replenishment over time
 */
async function testTokenBucket() {
    title('Testing Token Bucket Strategy...')

    const { limiter } = await createTokenBucketLimiter({
        strategy: {
            capacity: 5,
            refillRate: 2,
            refillTime: 1000, // Corrected: refill every 1 second (matches rate)
        },
        storage: { redisOptions: process.env.REDIS_URL },
    })

    for (let i = 0; i < 15; i++) {
        const result = await limiter.check('user123')
        isAllowed(`Request ${i + 1}:`, result.allowed)
        await new Promise(resolve => setTimeout(resolve, 200))
    }
}

/**
 * Tests individual fixed window strategy with multiple users
 * - 3 requests per 10-second window per user
 * - Tests 3 users making 5 requests each
 * - Demonstrates per-identifier rate limiting
 */
async function testIndividualFixedWindow() {
    title('Testing Individual Fixed Window Strategy...')

    const { limiter } = await createIndividualFixedWindowLimiter({
        strategy: { limit: 3, windowMs: 10000 },
        storage: { redisOptions: process.env.REDIS_URL },
    })

    const identifiers = ['user1', 'user2', 'user3']
    for (let i = 0; i < 5; i++) {
        for (const identifier of identifiers) {
            const result = await limiter.check(identifier)
            isAllowed(`Request ${i + 1} for ${identifier}:`, result.allowed)
        }
        await new Promise(resolve => setTimeout(resolve, 2000))
    }
}

/**
 * Main test runner
 * Executes all rate limiting strategy tests sequentially
 * Includes Docker-compatible execution wrapper
 */
async function main() {
    try {
        await testFixedWindow()
        await testSlidingWindow()
        await testTokenBucket()
        await testIndividualFixedWindow()
    } catch (error) {
        console.error('Error in examples:', error)
    } finally {
        line()
    }
}

withDocker(main)
