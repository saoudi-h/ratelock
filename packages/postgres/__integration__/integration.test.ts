import {
    fixedWindowContract,
    individualFixedWindowContract,
    slidingWindowContract,
    tokenBucketContract,
} from '@ratelock/test-utils'
import postgres from 'postgres'
import { afterAll, beforeAll, describe } from 'vitest'
import { fixedWindow, individualFixedWindow, slidingWindow, tokenBucket } from '../src'

const POSTGRES_URL =
    process.env.POSTGRES_URL ?? 'postgres://postgres:testpassword@localhost:5434/ratelock_test'

describe('@ratelock/postgres - Integration', () => {
    let sql: ReturnType<typeof postgres>

    beforeAll(async () => {
        sql = postgres(POSTGRES_URL)
    })

    afterAll(async () => {
        await sql.end()
    })

    describe('FixedWindow', () => {
        fixedWindowContract(async opts => {
            const limiter = await fixedWindow({
                ...opts,
                sql,
                skipMigrations: false,
            })
            return limiter
        })
    })

    describe('SlidingWindow', () => {
        slidingWindowContract(async opts => {
            const limiter = await slidingWindow({
                ...opts,
                sql,
                skipMigrations: false,
            })
            return limiter
        })
    })

    describe('TokenBucket', () => {
        tokenBucketContract(async opts => {
            const limiter = await tokenBucket({
                ...opts,
                sql,
                skipMigrations: false,
            })
            return limiter
        })
    })

    describe('IndividualFixedWindow', () => {
        individualFixedWindowContract(async opts => {
            const limiter = await individualFixedWindow({
                ...opts,
                sql,
                skipMigrations: false,
            })
            return limiter
        })
    })
})
