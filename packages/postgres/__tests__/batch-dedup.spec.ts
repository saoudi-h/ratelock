import { describe, expect, it } from 'vitest'

import type { PgDriver } from '../src/drivers/types'
import { fixedWindow } from '../src/fixed-window'
import { individualFixedWindow } from '../src/individual-fixed-window'
import { tokenBucket } from '../src/token-bucket'
import { MockPgDriver } from './driver.mock'

/**
 * Regression guard for duplicate-id batches.
 *
 * The dedup fallback used to run individual checks via Promise.all:
 * concurrent same-key UPSERTs resolve against different row snapshots
 * depending on lock order, so returned values were schedule-dependent
 * (observed live: [1,2,2] vs [2,2,1] on identical input). The fix makes
 * the fallback strictly sequential. These tests pin that property without
 * relying on real-DB timing.
 */
class InstrumentedDriver implements PgDriver {
    private inner = new MockPgDriver()
    private inFlight = 0
    maxInFlight = 0
    queries: string[] = []

    async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
        this.queries.push(sql.replace(/\s+/g, ' ').trim())
        this.inFlight++
        this.maxInFlight = Math.max(this.maxInFlight, this.inFlight)
        try {
            return await this.inner.query<T>(sql, params)
        } finally {
            this.inFlight--
        }
    }

    end(): Promise<void> {
        return this.inner.end()
    }
}

describe('duplicate-id batch fallback (CORE-02)', () => {
    it('fixed window: duplicate ids run sequentially and stay position-aligned', async () => {
        const drv = new InstrumentedDriver()
        const fw = await fixedWindow({
            sql: drv,
            limit: 3,
            windowMs: 60_000,
            prefix: 't',
            skipMigrations: true,
        })

        const results = await fw.checkBatch(['a', 'b', 'a'])

        expect(drv.maxInFlight).toBe(1)
        const singles = drv.queries.filter(
            q => q.startsWith('INSERT INTO') && q.includes('ON CONFLICT')
        )
        expect(singles.length).toBe(3)
        // Second 'a' consumed exactly one more slot than the first.
        expect(results.every(r => r.allowed)).toBe(true)
        expect(results[0]!.remaining - results[2]!.remaining).toBe(1)

        await fw.destroy?.()
    })

    it('token bucket: duplicate ids run sequentially', async () => {
        const drv = new InstrumentedDriver()
        const tb = await tokenBucket({
            sql: drv,
            capacity: 10,
            refillRate: 1,
            prefix: 't',
            skipMigrations: true,
        })

        await tb.checkBatch(['a', 'b', 'a'])

        expect(drv.maxInFlight).toBe(1)

        await tb.destroy?.()
    })

    it('individual fixed window: duplicate ids run sequentially', async () => {
        const drv = new InstrumentedDriver()
        const ifw = await individualFixedWindow({
            sql: drv,
            limit: 5,
            windowMs: 60_000,
            prefix: 't',
            skipMigrations: true,
        })

        await ifw.checkBatch(['a', 'a'])

        expect(drv.maxInFlight).toBe(1)

        await ifw.destroy?.()
    })

    it('unique-id fast path is untouched: one round-trip, zero single upserts', async () => {
        const drv = new InstrumentedDriver()
        const fw = await fixedWindow({
            sql: drv,
            limit: 3,
            windowMs: 60_000,
            prefix: 't',
            skipMigrations: true,
        })

        const results = await fw.checkBatch(['x', 'y', 'z'])

        expect(results.length).toBe(3)
        const batchQueries = drv.queries.filter(q => q.includes('WITH input AS'))
        expect(batchQueries.length).toBe(1)
        expect(drv.queries.filter(q => q.startsWith('INSERT INTO')).length).toBe(0)

        await fw.destroy?.()
    })
})
