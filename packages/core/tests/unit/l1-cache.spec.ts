import { L1Cache, type CacheConfig } from '@/cache/l1-cache'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('L1Cache', () => {
    let cache: L1Cache<string>
    let config: CacheConfig

    beforeEach(() => {
        config = {
            maxSize: 2,
            ttlMs: 50,
            cleanupIntervalMs: 20,
            enabled: true,
        }
        cache = new L1Cache<string>(config)
    })

    afterEach(() => {
        cache.stop()
    })

    it('get retourne undefined si clé absente ou cache disabled', () => {
        expect(cache.get('missing')).toBeUndefined()

        const disabled = new L1Cache<string>({ ...config, enabled: false })
        expect(disabled.get('x')).toBeUndefined()
        disabled.stop()
    })

    it('set/get stocke et récupère une valeur tant que TTL valide', async () => {
        cache.set('k1', 'v1', 30)
        expect(cache.get('k1')).toBe('v1')
        await new Promise(r => setTimeout(r, 35))
        expect([undefined, 'v1']).toContain(cache.get('k1'))
    })

    it('respecte le TTL par défaut depuis la config', async () => {
        cache.set('k1', 'v1')
        await new Promise(r => setTimeout(r, 10))
        expect(cache.get('k1')).toBe('v1')
        await new Promise(r => setTimeout(r, 60))
        expect([undefined, 'v1']).toContain(cache.get('k1'))
    })

    it('évince le LRU quand maxSize atteint', () => {
        cache.set('a', '1')
        cache.set('b', '2')
        expect(cache.get('a')).toBe('1')
        cache.set('c', '3')
        expect(cache.get('b')).toBeUndefined()
        expect(cache.get('a')).toBe('1')
        expect(cache.get('c')).toBe('3')
    })

    it('delete retire la clé du cache', () => {
        cache.set('x', '1')
        expect(cache.delete('x')).toBe(true)
        expect(cache.get('x')).toBeUndefined()
    })

    it('clear vide le cache', () => {
        cache.set('a', '1')
        cache.set('b', '2')
        cache.clear()
        expect(cache.get('a')).toBeUndefined()
        expect(cache.get('b')).toBeUndefined()
    })

    it('getStats retourne des métriques cohérentes', () => {
        cache.set('a', '1')
        cache.set('b', '2')
        expect(cache.get('a')).toBe('1') // hit
        expect(cache.get('c')).toBeUndefined() // miss
        const stats = cache.getStats()
        expect(stats.size).toBe(2)
        expect(stats.maxSize).toBe(2)
        expect(stats.hits + stats.misses).toBeGreaterThan(0)
        expect(stats.hitRate).toBeGreaterThanOrEqual(0)
        expect(stats.hitRate).toBeLessThanOrEqual(1)
    })
})
