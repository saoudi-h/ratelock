import {
    fixedWindowContract,
    individualFixedWindowContract,
    slidingWindowContract,
    tokenBucketContract,
} from '@ratelock/test-utils'
import pg from 'pg'
import postgres from 'postgres'
import { afterAll, beforeAll, describe } from 'vitest'

import { fixedWindow, individualFixedWindow, slidingWindow, tokenBucket } from '../src'

const POSTGRES_URL =
    process.env.POSTGRES_URL ?? 'postgres://postgres:testpassword@localhost:5434/ratelock_test'

describe('@ratelock/postgres - Integration', () => {
    describe('postgres.js driver', () => {
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
                    prefix: 'pgjs',
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
                    prefix: 'pgjs',
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
                    prefix: 'pgjs',
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
                    prefix: 'pgjs',
                    skipMigrations: false,
                })
                return limiter
            })
        })
    })

    describe('pg driver (pool)', () => {
        let pool: pg.Pool

        beforeAll(async () => {
            pool = new pg.Pool({ connectionString: POSTGRES_URL })
        })

        afterAll(async () => {
            await pool.end()
        })

        describe('FixedWindow', () => {
            fixedWindowContract(async opts => {
                const limiter = await fixedWindow({
                    ...opts,
                    pool,
                    prefix: 'pgpool',
                    skipMigrations: true,
                })
                return limiter
            })
        })

        describe('SlidingWindow', () => {
            slidingWindowContract(async opts => {
                const limiter = await slidingWindow({
                    ...opts,
                    pool,
                    prefix: 'pgpool',
                    skipMigrations: true,
                })
                return limiter
            })
        })

        describe('TokenBucket', () => {
            tokenBucketContract(async opts => {
                const limiter = await tokenBucket({
                    ...opts,
                    pool,
                    prefix: 'pgpool',
                    skipMigrations: true,
                })
                return limiter
            })
        })

        describe('IndividualFixedWindow', () => {
            individualFixedWindowContract(async opts => {
                const limiter = await individualFixedWindow({
                    ...opts,
                    pool,
                    prefix: 'pgpool',
                    skipMigrations: true,
                })
                return limiter
            })
        })
    })
})
