import { fixedWindow, tokenBucket } from '@ratelock/local'
import { Elysia } from 'elysia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { rateLimit } from '../src/index'

const LIMIT = 3
const WINDOW_MS = 60_000

async function handle(
    app: { handle: (request: Request) => Promise<Response> },
    path: string,
    headers?: Record<string, string>
) {
    const request = new Request(`http://localhost${path}`, { headers })
    const response = await app.handle(request)
    const parsedHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
        parsedHeaders[key] = value
    })
    let body: unknown
    try {
        body = await response.json()
    } catch {
        body = await response.text()
    }
    return { status: response.status, headers: parsedHeaders, body }
}

describe('rateLimit plugin (elysia)', () => {
    let limiter: Awaited<ReturnType<typeof fixedWindow>>

    beforeEach(async () => {
        limiter = await fixedWindow({ limit: LIMIT, windowMs: WINDOW_MS, prefix: 'elysia-test' })
    })

    afterEach(async () => {
        await limiter.destroy?.()
    })

    async function buildApp(options?: Omit<Parameters<typeof rateLimit>[0], 'limiter'>) {
        return new Elysia()
            .use(rateLimit({ limiter, limit: LIMIT, ...options }))
            .get('/api/ok', () => ({ ok: true }))
    }

    it('allows requests within the limit and emits both header families', async () => {
        const res = await handle(await buildApp(), '/api/ok')
        expect(res.status).toBe(200)
        expect(res.headers['x-ratelimit-remaining']).toBe(String(LIMIT - 1))
        expect(res.headers['ratelimit-remaining']).toBe(String(LIMIT - 1))
        expect(res.headers['x-ratelimit-limit']).toBe(String(LIMIT))
    })

    it('denies with 429, JSON body and Retry-After once exhausted', async () => {
        const app = await buildApp()
        for (let i = 0; i < LIMIT; i++) {
            const res = await handle(app, '/api/ok')
            expect(res.status).toBe(200)
        }
        const denied = await handle(app, '/api/ok')
        expect(denied.status).toBe(429)
        expect(denied.body).toEqual({ error: 'Too Many Requests' })
        const retryAfter = Number(denied.headers['retry-after'])
        expect(retryAfter).toBeGreaterThan(0)
        expect(retryAfter).toBeLessThanOrEqual(WINDOW_MS / 1000)
        expect(denied.headers['x-ratelimit-remaining']).toBe('0')
    })

    it('supports custom denial status code and message', async () => {
        const app = await buildApp({ denyStatusCode: 418, message: 'slow down' })
        for (let i = 0; i < LIMIT; i++) await handle(app, '/api/ok')
        const denied = await handle(app, '/api/ok')
        expect(denied.status).toBe(418)
        expect(denied.body).toEqual({ error: 'slow down' })
    })

    it('isolates identifiers through keyGenerator', async () => {
        const keyedLimiter = await fixedWindow({
            limit: 1,
            windowMs: WINDOW_MS,
            prefix: 'elysia-keyed',
        })
        const app = new Elysia()
            .use(
                rateLimit({
                    limiter: keyedLimiter,
                    keyGenerator: ({ request }) => request.headers.get('x-user') ?? 'anon',
                })
            )
            .get('/api/ok', () => ({ ok: true }))

        const first = await handle(app, '/api/ok', { 'x-user': 'alice' })
        const second = await handle(app, '/api/ok', { 'x-user': 'alice' })
        const other = await handle(app, '/api/ok', { 'x-user': 'bob' })

        expect(first.status).toBe(200)
        expect(second.status).toBe(429)
        expect(other.status).toBe(200)
        await keyedLimiter.destroy?.()
    })

    it('emits only RFC family with headers: rfc', async () => {
        const res = await handle(await buildApp({ headers: 'rfc' }), '/api/ok')
        expect(res.headers['ratelimit-remaining']).not.toBeNull()
        expect(res.headers['x-ratelimit-remaining']).toBeUndefined()
    })

    it('emits no headers with headers: false', async () => {
        const res = await handle(await buildApp({ headers: false }), '/api/ok')
        expect(res.headers['ratelimit-remaining']).toBeUndefined()
        expect(res.headers['x-ratelimit-remaining']).toBeUndefined()
        expect(res.status).toBe(200)
    })

    it('accepts a lazy factory and defers initialization to the first matched request', async () => {
        const factory = vi.fn(async () =>
            fixedWindow({ limit: LIMIT, windowMs: WINDOW_MS, prefix: 'elysia-lazy' })
        )
        const app = new Elysia()
            .use(rateLimit({ limiter: factory, limit: LIMIT }))
            .get('/api/ok', () => ({ ok: true }))

        expect(factory).not.toHaveBeenCalled()

        const res = await handle(app, '/api/ok')
        expect(res.status).toBe(200)
        expect(factory).toHaveBeenCalledTimes(1)

        const again = await handle(app, '/api/ok')
        expect(again.status).toBe(200)
        expect(factory).toHaveBeenCalledTimes(1)
    })

    it('projects token bucket results onto remaining/reset headers', async () => {
        const bucket = await tokenBucket({
            capacity: 10,
            refillRate: 1,
            prefix: 'elysia-tb',
        } as never)
        const app = new Elysia()
            .use(rateLimit({ limiter: bucket as never }))
            .get('/api/ok', () => ({ ok: true }))

        const res = await handle(app, '/api/ok')
        expect(res.status).toBe(200)
        expect(Number(res.headers['x-ratelimit-remaining'])).toBeLessThan(10)
        await bucket.destroy?.()
    })

    it('counts unidentifiable requests into one shared bucket by default', async () => {
        const anonLimiter = await fixedWindow({
            limit: 2,
            windowMs: WINDOW_MS,
            prefix: 'elysia-anon',
        })
        const app = new Elysia()
            .use(rateLimit({ limiter: anonLimiter }))
            .get('/api/ok', () => ({ ok: true }))

        expect((await handle(app, '/api/ok')).status).toBe(200)
        expect((await handle(app, '/api/ok')).status).toBe(200)
        expect((await handle(app, '/api/ok')).status).toBe(429)
        await anonLimiter.destroy?.()
    })
})
