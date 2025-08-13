import consola from 'consola'
import { createFixedWindowLimiter } from '../src/factory/fixed-window-factory'
import { isAllowed, line } from './utils/draw'
import { loadEnv } from './utils/env'
import { withDocker } from './utils/withDocker'

async function main() {
    line()
    consola.box('Basic Usage Example')
    const { limiter } = await createFixedWindowLimiter({
        strategy: {
            limit: 10,
            windowMs: 60000, // 1 minute
        },
        storage: {
            redisOptions: {
                url: process.env.REDIS_URL,
            },
        },
    })

    try {
        // Check if a request is allowed
        const result = await limiter.check('user123')

        isAllowed('Request 1:', result.allowed)
    } catch (error) {
        consola.error('Rate limiting error:', error)
    } finally {
        line()
    }

    // The new factory does not return a close function.
    // The redis client connection should be managed by the application.
}

loadEnv()
await withDocker(main)
