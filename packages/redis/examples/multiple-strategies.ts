import { createFixedWindowLimiter } from '../src/factory/fixed-window-factory'
import { createSlidingWindowLimiter } from '../src/factory/sliding-window-factory'
import { createTokenBucketLimiter } from '../src/factory/token-bucket-factory'
import { createIndividualFixedWindowLimiter } from '../src/factory/individual-fixed-window-factory'
import { config } from 'dotenv'
import { withDocker } from './utils/withDocker'
import { line, title, isAllowed } from './utils/draw'

config({ path: '../.env.test' })




async function testFixedWindow() {
  line()
  title('Testing Fixed Window Strategy...')
  
  const { limiter } = await createFixedWindowLimiter({
    strategy: {
      limit: 3,
      windowMs: 10000, // 10 seconds
    },
    storage: {
      redisOptions: process.env.REDIS_URL,
    },
  })

  for (let i = 0; i < 7; i++) {
    const result = await limiter.check('user123')
    isAllowed(`Request ${i + 1}:`, result.allowed)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

async function testSlidingWindow() {
  title('Testing Sliding Window Strategy...')
  
  const { limiter } = await createSlidingWindowLimiter({
    strategy: {
      limit: 3,
      windowMs: 10000, // 10 seconds
    },
    storage: {
      redisOptions: process.env.REDIS_URL,
    },
  })

  for (let i = 0; i < 5; i++) {
    const result = await limiter.check('user123')
    isAllowed(`Request ${i + 1}:`, result.allowed)
    await new Promise(resolve => setTimeout(resolve, 1500))
  }
}

async function testTokenBucket() {
  title('Testing Token Bucket Strategy...')
  
  const { limiter } = await createTokenBucketLimiter({
    strategy: {
      capacity: 5,
      refillRate: 2, // 2 tokens per second
      refillTime: 2000, // refill every 1 second
    },
    storage: {
      redisOptions: process.env.REDIS_URL,
    },
  })

  for (let i = 0; i < 15; i++) {
    const result = await limiter.check('user123')
    isAllowed(`Request ${i + 1}:`, result.allowed)
    await new Promise(resolve => setTimeout(resolve, 200))
  }
}

async function testIndividualFixedWindow() {
  title('Testing Individual Fixed Window Strategy...')
  
  const { limiter } = await createIndividualFixedWindowLimiter({
    strategy: {
      limit: 3,
      windowMs: 10000, // 10 seconds
    },
    storage: {
      redisOptions: process.env.REDIS_URL,
    },
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
