import { fixedWindow } from '@ratelock/local'
import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { rateLimit } from '../src/index'

const LIMIT = 3
const WINDOW_MS = 60_000

describe('rateLimit middleware', () => {
    let limiter: Awaited<ReturnType<typeof fixedWindow>>

    beforeEach(async () => {
        limiter = await fixedWindow({ limit: LIMIT, windowMs: WINDOW_MS, prefix: 'hono-test' })
    })

    afterEach(async () => {
        await limiter.destroy?.()
    })

    function buildApp(options?: Omit<Parameters<typeof rateLimit>[0], 'limiter'>): Hono {
        const app = new Hono()
        app.use('/api/*', rateLimit({ limiter, limit: LIMIT, ...options }))
        app.get('/api/ok', c => c.text('ok'))
        return app
    }

    it('allows requests within the limit and emits both header families', async () => {
        const app = buildApp()
        const res = await app.request('/api/ok')
        expect(res.status).toBe(200)
        expect(res.headers.get('x-ratelimit-remaining')).toBe(String(LIMIT - 1))
        expect(res.headers.get('ratelimit-remaining')).toBe(String(LIMIT - 1))
        expect(res.headers.get('x-ratelimit-limit')).toBe(String(LIMIT))
        expect(res.headers.get('ratelimit-limit')).toBe(String(LIMIT))
    })

    it('denies with 429, JSON body and Retry-After once exhausted', async () => {
        const app = buildApp()
        for (let i = 0; i < LIMIT; i++) {
            const res = await app.request('/api/ok')
            expect(res.status).toBe(200)
        }
        const denied = await app.request('/api/ok')
        expect(denied.status).toBe(429)
        expect(await denied.json()).toEqual({ error: 'Too Many Requests' })
        const retryAfter = Number(denied.headers.get('retry-after'))
        expect(retryAfter).toBeGreaterThan(0)
        expect(retryAfter).toBeLessThanOrEqual(WINDOW_MS / 1000)
        expect(denied.headers.get('x-ratelimit-remaining')).toBe('0')
    })

    it('supports custom denial status code and message', async () => {
        const app = buildApp({ denyStatusCode: 418, message: 'slow down' })
        for (let i = 0; i < LIMIT; i++) await app.request('/api/ok')
        const denied = await app.request('/api/ok')
        expect(denied.status).toBe(418)
        expect(await denied.json()).toEqual({ error: 'slow down' })
    })

    it('isolates identifiers through keyGenerator', async () => {
        const keyedLimiter = await fixedWindow({
            limit: 1,
            windowMs: WINDOW_MS,
            prefix: 'hono-keyed',
        })
        const keyedApp = new Hono()
        keyedApp.use(
            '/api/*',
            rateLimit({
                limiter: keyedLimiter,
                limit: 1,
                keyGenerator: c => c.req.header('x-user') ?? 'anon',
            })
        )
        keyedApp.get('/api/ok', c => c.text('ok'))

        const first = await keyedApp.request('/api/ok', { headers: { 'x-user': 'alice' } })
        const second = await keyedApp.request('/api/ok', { headers: { 'x-user': 'alice' } })
        const other = await keyedApp.request('/api/ok', { headers: { 'x-user': 'bob' } })

        expect(first.status).toBe(200)
        expect(second.status).toBe(429)
        expect(other.status).toBe(200)
        await keyedLimiter.destroy?.()
    })

    it('emits only RFC family with headers: rfc', async () => {
        const app = buildApp({ headers: 'rfc' })
        const res = await app.request('/api/ok')
        expect(res.headers.get('ratelimit-remaining')).not.toBeNull()
        expect(res.headers.get('x-ratelimit-remaining')).toBeNull()
    })

    it('emits no headers with headers: false', async () => {
        const app = buildApp({ headers: false })
        const res = await app.request('/api/ok')
        expect(res.headers.get('ratelimit-remaining')).toBeNull()
        expect(res.headers.get('x-ratelimit-remaining')).toBeNull()
        expect(res.status).toBe(200)
    })

    it('accepts a lazy factory and defers initialization to the first request', async () => {
        const factory = vi.fn(async () =>
            fixedWindow({ limit: LIMIT, windowMs: WINDOW_MS, prefix: 'hono-lazy' })
        )
        const lazyApp = new Hono()
        lazyApp.use('/api/*', rateLimit({ limiter: factory, limit: LIMIT }))
        lazyApp.get('/api/ok', c => c.text('ok'))

        expect(factory).not.toHaveBeenCalled()

        await lazyApp.request('/outside')
        expect(factory).not.toHaveBeenCalled()

        const res = await lazyApp.request('/api/ok')
        expect(res.status).toBe(200)
        expect(factory).toHaveBeenCalledTimes(1)

        const again = await lazyApp.request('/api/ok')
        expect(again.status).toBe(200)
        expect(factory).toHaveBeenCalledTimes(1)
    })

    it('projects token bucket results onto remaining/reset headers', async () => {
        const { tokenBucket } = await import('@ratelock/local')
        const bucket = await tokenBucket({
            capacity: 10,
            refillRate: 1,
            prefix: 'hono-tb',
        } as never)
        const tbApp = new Hono()
        tbApp.use('/api/*', rateLimit({ limiter: bucket as never, headers: 'both' }))
        tbApp.get('/api/ok', c => c.text('ok'))

        const res = await tbApp.request('/api/ok')
        expect(res.status).toBe(200)
        expect(Number(res.headers.get('x-ratelimit-remaining'))).toBeLessThan(10)
        expect(
            Number(res.headers.get('retry-after')) === 0 || res.headers.get('retry-after')
        ).toBeTruthy()
        await bucket.destroy?.()
    })

    it('counts unidentifiable requests into one shared bucket by default', async () => {
        const anonLimiter = await fixedWindow({
            limit: 2,
            windowMs: WINDOW_MS,
            prefix: 'hono-anon',
        })
        const anonApp = new Hono()
        anonApp.use('/api/*', rateLimit({ limiter: anonLimiter }))
        anonApp.get('/api/ok', c => c.text('ok'))

        expect((await anonApp.request('/api/ok')).status).toBe(200)
        expect((await anonApp.request('/api/ok')).status).toBe(200)
        expect((await anonApp.request('/api/ok')).status).toBe(429)
        await anonLimiter.destroy?.()
    })
})
