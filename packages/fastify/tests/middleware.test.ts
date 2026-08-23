import { createRequire } from 'node:module'

import { fixedWindow } from '@ratelock/local'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import Fastify5 from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { RateLimitOptions } from '../src/index'
import { rateLimit } from '../src/index'

const require = createRequire(import.meta.url)
const Fastify4 = require('fastify4') as typeof Fastify5

const LIMIT = 3
const WINDOW_MS = 60_000

interface MajorDeps {
    app: (options?: Record<string, unknown>) => ReturnType<typeof Fastify5>
}

const majors: Array<{ name: string; deps: MajorDeps }> = [
    { name: 'fastify 5', deps: { app: options => Fastify5(options) } },
    { name: 'fastify 4', deps: { app: options => Fastify4(options) } },
]

describe.each(majors)('rateLimit plugin ($name)', ({ deps }) => {
    let limiter: Awaited<ReturnType<typeof fixedWindow>>

    beforeEach(async () => {
        limiter = await fixedWindow({ limit: LIMIT, windowMs: WINDOW_MS, prefix: 'fastify-test' })
    })

    afterEach(async () => {
        await limiter.destroy?.()
    })

    async function buildApp(options?: Omit<RateLimitOptions, 'limiter'>) {
        const app = deps.app()
        await app.register(rateLimit, { limiter, limit: LIMIT, ...options })
        app.get('/api/ok', async () => ({ ok: true }))
        await app.ready()
        return app
    }

    it('allows requests within the limit and emits both header families', async () => {
        const app = await buildApp()
        const res = await app.inject({ method: 'GET', url: '/api/ok' })
        expect(res.statusCode).toBe(200)
        expect(res.headers['x-ratelimit-remaining']).toBe(String(LIMIT - 1))
        expect(res.headers['ratelimit-remaining']).toBe(String(LIMIT - 1))
        expect(res.headers['x-ratelimit-limit']).toBe(String(LIMIT))
        expect(res.headers['ratelimit-limit']).toBe(String(LIMIT))
    })

    it('denies with 429, JSON body and Retry-After once exhausted', async () => {
        const app = await buildApp()
        for (let i = 0; i < LIMIT; i++) {
            const res = await app.inject({ method: 'GET', url: '/api/ok' })
            expect(res.statusCode).toBe(200)
        }
        const denied = await app.inject({ method: 'GET', url: '/api/ok' })
        expect(denied.statusCode).toBe(429)
        expect(denied.json()).toEqual({ error: 'Too Many Requests' })
        const retryAfter = Number(denied.headers['retry-after'])
        expect(retryAfter).toBeGreaterThan(0)
        expect(retryAfter).toBeLessThanOrEqual(WINDOW_MS / 1000)
        expect(denied.headers['x-ratelimit-remaining']).toBe('0')
    })

    it('supports custom denial status code and message', async () => {
        const app = await buildApp({ denyStatusCode: 418, message: 'slow down' })
        for (let i = 0; i < LIMIT; i++) await app.inject({ method: 'GET', url: '/api/ok' })
        const denied = await app.inject({ method: 'GET', url: '/api/ok' })
        expect(denied.statusCode).toBe(418)
        expect(denied.json()).toEqual({ error: 'slow down' })
    })

    it('applies to routes registered in child encapsulation scopes', async () => {
        const app = deps.app()
        await app.register(rateLimit, { limiter, limit: LIMIT })
        await app.register(async (child: FastifyInstance) => {
            child.get('/api/nested', async () => ({ ok: true }))
        })
        await app.ready()

        const res = await app.inject({ method: 'GET', url: '/api/nested' })
        expect(res.status === 200 || res.statusCode).toBe(200)
        expect(res.headers['x-ratelimit-remaining']).toBe(String(LIMIT - 1))
    })

    it('isolates identifiers through keyGenerator', async () => {
        const keyedLimiter = await fixedWindow({
            limit: 1,
            windowMs: WINDOW_MS,
            prefix: 'fastify-keyed',
        })
        const app = deps.app()
        await app.register(rateLimit, {
            limiter: keyedLimiter,
            keyGenerator: (request: FastifyRequest) =>
                (request.headers['x-user'] as string | undefined) ?? 'anon',
        })
        app.get('/api/ok', async () => ({ ok: true }))
        await app.ready()

        const first = await app.inject({
            method: 'GET',
            url: '/api/ok',
            headers: { 'x-user': 'alice' },
        })
        const second = await app.inject({
            method: 'GET',
            url: '/api/ok',
            headers: { 'x-user': 'alice' },
        })
        const other = await app.inject({
            method: 'GET',
            url: '/api/ok',
            headers: { 'x-user': 'bob' },
        })

        expect(first.statusCode).toBe(200)
        expect(second.statusCode).toBe(429)
        expect(other.statusCode).toBe(200)
        await keyedLimiter.destroy?.()
    })

    it('emits only RFC family with headers: rfc', async () => {
        const app = await buildApp({ headers: 'rfc' })
        const res = await app.inject({ method: 'GET', url: '/api/ok' })
        expect(res.headers['ratelimit-remaining']).not.toBeNull()
        expect(res.headers['x-ratelimit-remaining']).toBeUndefined()
    })

    it('emits no headers with headers: false', async () => {
        const app = await buildApp({ headers: false })
        const res = await app.inject({ method: 'GET', url: '/api/ok' })
        expect(res.headers['ratelimit-remaining']).toBeUndefined()
        expect(res.headers['x-ratelimit-remaining']).toBeUndefined()
        expect(res.statusCode).toBe(200)
    })

    it('accepts a lazy factory and defers initialization to the first matched request', async () => {
        const factory = vi.fn(async () =>
            fixedWindow({ limit: LIMIT, windowMs: WINDOW_MS, prefix: 'fastify-lazy' })
        )
        const app = deps.app()
        await app.register(rateLimit, { limiter: factory, limit: LIMIT })
        app.get('/api/ok', async () => ({ ok: true }))
        await app.ready()
        // Unlike Express or Hono, Fastify runs global onRequest hooks even on
        // unmatched paths, so boot itself must be the only deferral boundary.
        expect(factory).not.toHaveBeenCalled()

        const res = await app.inject({ method: 'GET', url: '/api/ok' })
        expect(res.statusCode).toBe(200)
        expect(factory).toHaveBeenCalledTimes(1)

        const again = await app.inject({ method: 'GET', url: '/api/ok' })
        expect(again.statusCode).toBe(200)
        expect(factory).toHaveBeenCalledTimes(1)
    })

    it('forwards limiter failures through the fastify error handler, on both majors', async () => {
        const failing = {
            check: async () => {
                throw new Error('redis down')
            },
            checkBatch: async () => {
                throw new Error('redis down')
            },
        }
        const app = deps.app()
        await app.register(rateLimit, { limiter: failing as never })
        app.get('/api/ok', async () => ({ ok: true }))
        app.setErrorHandler((error: Error, _request: FastifyRequest, reply: any) => {
            void reply.status(503).send({ error: error.message })
        })
        await app.ready()

        const res = await app.inject({ method: 'GET', url: '/api/ok' })
        expect(res.statusCode).toBe(503)
        expect(res.json()).toEqual({ error: 'redis down' })
    })

    it('uses request.ip and honors trustProxy for identifier resolution', async () => {
        const ipLimiter = await fixedWindow({ limit: 1, windowMs: WINDOW_MS, prefix: 'fastify-ip' })
        const app = deps.app({ trustProxy: true })
        await app.register(rateLimit, { limiter: ipLimiter })
        app.get('/api/ok', async () => ({ ok: true }))
        await app.ready()

        const clientA = await app.inject({
            method: 'GET',
            url: '/api/ok',
            headers: { 'x-forwarded-for': '203.0.113.10' },
        })
        const clientAAgain = await app.inject({
            method: 'GET',
            url: '/api/ok',
            headers: { 'x-forwarded-for': '203.0.113.10' },
        })
        const clientB = await app.inject({
            method: 'GET',
            url: '/api/ok',
            headers: { 'x-forwarded-for': '203.0.113.11' },
        })

        expect(clientA.statusCode).toBe(200)
        expect(clientAAgain.statusCode).toBe(429)
        expect(clientB.statusCode).toBe(200)
        await ipLimiter.destroy?.()
    })
})
