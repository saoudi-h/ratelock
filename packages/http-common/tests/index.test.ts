import { describe, expect, it, vi } from 'vitest'
import { collectRateLimitHeaders, createLimiterResolver, projectResult } from '../src/index'

describe('createLimiterResolver', () => {
    it('passes instances through without wrapping overhead', async () => {
        const instance = { check: vi.fn(), checkBatch: vi.fn() }
        const resolve = createLimiterResolver(instance as never)
        expect(await resolve()).toBe(instance)
    })

    it('memoizes factory results across calls', async () => {
        const factory = vi.fn(async () => ({ check: vi.fn(), checkBatch: vi.fn() }))
        const resolve = createLimiterResolver(factory as never)
        const first = await resolve()
        const second = await resolve()
        expect(factory).toHaveBeenCalledTimes(1)
        expect(second).toBe(first)
    })
})

describe('projectResult', () => {
    it('projects window results directly', () => {
        expect(
            projectResult({ allowed: true, remaining: 4, reset: Date.now() + 30_000 })
        ).toMatchObject({
            remaining: 4,
        })
    })

    it('floors token bucket tokens and maps refill time to reset seconds', () => {
        const info = projectResult({ allowed: true, tokens: 2.7, refillTime: 1500 })
        expect(info.remaining).toBe(2)
        expect(info.resetSeconds).toBe(2)
    })

    it('treats values above the epoch threshold as timestamps', () => {
        const now = Date.now()
        const info = projectResult({ allowed: false, remaining: 0, reset: now + 10_000 })
        expect(info.resetSeconds).toBeGreaterThan(8)
        expect(info.resetSeconds).toBeLessThanOrEqual(10)
    })

    it('returns nulls when nothing matches a known shape', () => {
        expect(projectResult({})).toEqual({ remaining: null, resetSeconds: null })
    })
})

describe('collectRateLimitHeaders', () => {
    const info = { remaining: 4, resetSeconds: 30 }

    it('emits both families by default when limit is provided', () => {
        expect(collectRateLimitHeaders(info, 'both', 100)).toEqual({
            'RateLimit-Limit': '100',
            'RateLimit-Remaining': '4',
            'RateLimit-Reset': '30',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '4',
            'X-RateLimit-Reset': '30',
        })
    })

    it('omits limit headers when quota is unknown', () => {
        const headers = collectRateLimitHeaders(info, 'both')
        expect(headers['RateLimit-Limit']).toBeUndefined()
        expect(headers['X-RateLimit-Remaining']).toBe('4')
    })

    it('respects single-family modes', () => {
        expect(Object.keys(collectRateLimitHeaders(info, 'rfc'))).not.toContain(
            'X-RateLimit-Remaining'
        )
        expect(Object.keys(collectRateLimitHeaders(info, 'legacy'))).not.toContain(
            'RateLimit-Remaining'
        )
    })

    it('collects nothing in disabled mode', () => {
        expect(collectRateLimitHeaders(info, false, 100)).toEqual({})
    })
})
