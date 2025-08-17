import consola from 'consola'
import { createFixedWindowLimiter } from '../src/factory/strategies/fixed-window-factory'
import { isAllowed, line } from './utils/draw'
import { loadEnv } from './utils/env'
import { withDocker } from './utils/withDocker'

/**
 * Demonstrates basic fixed window rate limiter usage with Redis storage
 * - Configures 10 requests per 1-minute window
 * - Shows single request check example
 * - Includes Docker-compatible execution wrapper
 */
async function main() {
    line()
    consola.box('Basic Usage Example')

    const { limiter } = await createFixedWindowLimiter({
        strategy: {
            limit: 10,
            windowMs: 60000,
        },
        storage: {
            redisOptions: {
                url: process.env.REDIS_URL,
            },
        },
    })

    try {
        const result = await limiter.check('user123')
        isAllowed('Request 1:', result.allowed)
    } catch (error) {
        consola.error('Rate limiting error:', error)
    } finally {
        line()
    }
}

loadEnv()
await withDocker(main)
