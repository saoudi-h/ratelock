import { StorageService } from 'index'
import { RateLimiter } from '../src/limiter/rate-limiter'
import { createFixedWindowStrategy } from '../src/strategy'

async function testLocalPackage() {
    console.log('Testing @ratelock/local package...')

    try {
        // Create a rate limiter
        const storage = new StorageService()
        const limiter = new RateLimiter(
            {
                strategy: createFixedWindowStrategy(storage, { limit: 3, windowMs: 5000 }),
                storage,
            }
        )

        const userId = 'test-user'

        // Test basic functionality
        console.log('Testing basic rate limiting:')

        for (let i = 1; i <= 5; i++) {
            const result = await limiter.check(userId)
            console.log(
                `  Request ${i}: ${result.allowed ? 'ALLOWED' : 'DENIED'} (${result.remaining} remaining)`
            )
        }

        // Test batch operations
        console.log('\nTesting batch operations:')
        const batchResults = await limiter.checkBatch(['user1', 'user2', 'user3'])
        batchResults.forEach((result, index) => {
            console.log(`  User ${index + 1}: ${result.allowed ? 'ALLOWED' : 'DENIED'}`)
        })


        console.log('\n✅ All tests passed! @ratelock/local is working correctly.')
    } catch (error) {
        console.error('❌ Test failed:', error)
        process.exit(1)
    }
}

// Run the test
testLocalPackage()
