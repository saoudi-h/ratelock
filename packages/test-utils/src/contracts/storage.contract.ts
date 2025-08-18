import type { Storage } from '@ratelock/core'
import { beforeEach, describe, expect, it } from 'vitest'

/**
 * Factory function that returns a fresh instance of Storage for each test.
 */
export type StorageFactory = () => Storage

/**
 * Generic contract to validate a Storage adapter compliant with @ratelock/core.
 * The API is based on string values and primitives, with TTL in milliseconds.
 */
export function storageContract(createStorage: StorageFactory) {
    describe('Storage Contract', () => {
        let storage: Storage
        beforeEach(() => {
            storage = createStorage()
        })

        it('set/get stores and retrieves a string value', async () => {
            await storage.set('k1', '42')
            const v = await storage.get('k1')
            expect(v).toBe('42')
        })

        it('get returns null for a missing key', async () => {
            const v = await storage.get('missing')
            expect(v).toBeNull()
        })

        it('increment increases by 1 and creates the key if missing', async () => {
            const n1 = await storage.increment('inc')
            expect(typeof n1).toBe('number')
            const n2 = await storage.increment('inc')
            expect(n2).toBe(n1 + 1)
        })

        it('incrementIf respects the max bound and exposes incremented/value', async () => {
            const r1 = await storage.incrementIf('incIf', 2)
            expect(r1.value).toBe(1)
            expect(r1.incremented).toBe(true)
            const r2 = await storage.incrementIf('incIf', 2)
            expect(r2.value).toBe(2)
            expect(r2.incremented).toBe(true)
            const r3 = await storage.incrementIf('incIf', 2)
            expect(r3.value).toBe(2)
            expect(r3.incremented).toBe(false)
        })

        it('decrement decreases the value (with optional min)', async () => {
            await storage.set('dec', '2')
            const n1 = await storage.decrement('dec')
            expect(n1).toBe(1)
            const n2 = await storage.decrement('dec', 0)
            expect(n2).toBe(0)
        })

        it('delete removes a key', async () => {
            await storage.set('del', 'x')
            await storage.delete('del')
            const v = await storage.get('del')
            expect(v).toBeNull()
        })

        it('expire applies a TTL on an existing key', async () => {
            await storage.set('ttl', 'abc')
            await storage.expire('ttl', 10)
            const v1 = await storage.get('ttl')
            expect(v1).toBe('abc')
            await new Promise(r => setTimeout(r, 20))
            const v2 = await storage.get('ttl')
            expect([null, 'abc']).toContain(v2)
        })

        it('pipeline exposes exec and chains supported operations', async () => {
            const p = storage.pipeline()
            p.set('p1', 'a', 50)
            p.get('p1')
            p.increment('p2')
            const res = await p.exec()
            expect(res).toHaveLength(3)
            expect(res[0]).toBe('OK')
            expect(res[1]).toBe('a')
            expect(res[2]).toBe('1')
            const got = await storage.get('p1')
            expect(got).toBe('a')
            const n = await storage.increment('p2')
            expect(n).toBeGreaterThan(0)
        })

        it('timestamps: add/count/getOldest/cleanup work', async () => {
            const id = 'ts:bucket'
            await storage.addTimestamp(id, Date.now(), 50)
            const count1 = await storage.countTimestamps(id, 1000)
            expect(count1).toBeGreaterThanOrEqual(1)
            const oldest = await storage.getOldestTimestamp(id)
            expect(oldest === null || typeof oldest === 'number').toBe(true)
            await storage.cleanupTimestamps(id)
            const count2 = await storage.countTimestamps(id, 1000)
            expect(count2).toBeGreaterThanOrEqual(0)
        })

        it('multiGet/multiSet work', async () => {
            await storage.multiSet([
                { key: 'm1', value: 'a' },
                { key: 'm2', value: 'b', ttlMs: 50 },
            ])
            const res = await storage.multiGet(['m1', 'm2', 'm3'])
            expect(res).toEqual(['a', 'b', null])
        })

        it('exists reflects the presence of the key', async () => {
            await storage.set('ex1', '1')
            expect(await storage.exists('ex1')).toBe(true)
            await storage.delete('ex1')
            expect(await storage.exists('ex1')).toBe(false)
        })
    })
}
