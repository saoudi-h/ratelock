import { createRequire } from 'node:module'

import { fixedWindow } from '@ratelock/local'
import type { Express } from 'express'
import express5 from 'express'
import supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { rateLimit } from '../src/index'

const require = createRequire(import.meta.url)
const express4 = require('express4') as typeof express5

const LIMIT = 3
const WINDOW_MS = 60_000

interface MajorDeps {
    app: () => Express
}

const majors: Array<{ name: string; deps: MajorDeps }> = [
    { name: 'express 5', deps: { app: () => express5() } },
    { name: 'express 4', deps: { app: () => express4() } },
]

describe.each(majors)('rateLimit middleware ($name)', ({ deps }) => {
    let limiter: Awaited<ReturnType<typeof fixedWindow>>

    beforeEach(async () => {
        limiter = await fixedWindow({ limit: LIMIT, windowMs: WINDOW_MS, prefix: 'express-test' })
    })

    afterEach(async () => {
        await limiter.destroy?.()
    })

    function buildApp(options?: Omit<Parameters<typeof rateLimit>[0], 'limiter'>): Express {
        const app = deps.app()
        app.use('/api', rateLimit({ limiter, limit: LIMIT, ...options }))
        app.get('/api/ok', (_req, res) => res.json({ ok: true }))
        return app
    }

    it('allows requests within the limit and emits both header families', async () => {
        const res = await supertest(buildApp()).get('/api/ok')
        expect(res.status).toBe(200)
        expect(res.headers['x-ratelimit-remaining']).toBe(String(LIMIT - 1))
        expect(res.headers['ratelimit-remaining']).toBe(String(LIMIT - 1))
        expect(res.headers['x-ratelimit-limit']).toBe(String(LIMIT))
        expect(res.headers['ratelimit-limit']).toBe(String(LIMIT))
    })

    it('denies with 429, JSON body and Retry-After once exhausted', async () => {
        const app = buildApp()
        for (let i = 0; i < LIMIT; i++) {
            const res = await supertest(app).get('/api/ok')
            expect(res.status).toBe(200)
        }
        const denied = await supertest(app).get('/api/ok')
        expect(denied.status).toBe(429)
        expect(denied.body).toEqual({ error: 'Too Many Requests' })
        const retryAfter = Number(denied.headers['retry-after'])
        expect(retryAfter).toBeGreaterThan(0)
        expect(retryAfter).toBeLessThanOrEqual(WINDOW_MS / 1000)
        expect(denied.headers['x-ratelimit-remaining']).toBe('0')
    })

    it('supports custom denial status code and message', async () => {
        const app = buildApp({ denyStatusCode: 418, message: 'slow down' })
        for (let i = 0; i < LIMIT; i++) await supertest(app).get('/api/ok')
        const denied = await supertest(app).get('/api/ok')
        expect(denied.status).toBe(418)
        expect(denied.body).toEqual({ error: 'slow down' })
    })

    it('isolates identifiers through keyGenerator', async () => {
        const keyedLimiter = await fixedWindow({
            limit: 1,
            windowMs: WINDOW_MS,
            prefix: 'express-keyed',
        })
        const app = deps.app()
        app.use(
            '/api',
            rateLimit({
                limiter: keyedLimiter,
                limit: 1,
                keyGenerator: req => (req.headers['x-user'] as string | undefined) ?? 'anon',
            })
        )
        app.get('/api/ok', (_req, res) => res.json({ ok: true }))

        const first = await supertest(app).get('/api/ok').set('x-user', 'alice')
        const second = await supertest(app).get('/api/ok').set('x-user', 'alice')
        const other = await supertest(app).get('/api/ok').set('x-user', 'bob')

        expect(first.status).toBe(200)
        expect(second.status).toBe(429)
        expect(other.status).toBe(200)
        await keyedLimiter.destroy?.()
    })

    it('emits only RFC family with headers: rfc', async () => {
        const res = await supertest(buildApp({ headers: 'rfc' })).get('/api/ok')
        expect(res.headers['ratelimit-remaining']).not.toBeNull()
        expect(res.headers['x-ratelimit-remaining']).toBeUndefined()
    })

    it('emits no headers with headers: false', async () => {
        const res = await supertest(buildApp({ headers: false })).get('/api/ok')
        expect(res.headers['ratelimit-remaining']).toBeUndefined()
        expect(res.headers['x-ratelimit-remaining']).toBeUndefined()
        expect(res.status).toBe(200)
    })

    it('accepts a lazy factory and defers initialization to the first matched request', async () => {
        const factory = vi.fn(async () =>
            fixedWindow({ limit: LIMIT, windowMs: WINDOW_MS, prefix: 'express-lazy' })
        )
        const app = deps.app()
        app.use('/api', rateLimit({ limiter: factory, limit: LIMIT }))
        app.get('/api/ok', (_req, res) => res.json({ ok: true }))

        expect(factory).not.toHaveBeenCalled()

        await supertest(app).get('/outside')
        expect(factory).not.toHaveBeenCalled()

        const res = await supertest(app).get('/api/ok')
        expect(res.status).toBe(200)
        expect(factory).toHaveBeenCalledTimes(1)

        const again = await supertest(app).get('/api/ok')
        expect(again.status).toBe(200)
        expect(factory).toHaveBeenCalledTimes(1)
    })

    it('forwards limiter failures through next(), on both majors', async () => {
        const failing = {
            check: async () => {
                throw new Error('redis down')
            },
            checkBatch: async () => {
                throw new Error('redis down')
            },
        }
        const app = deps.app()
        app.use('/api', rateLimit({ limiter: failing as never }))
        app.get('/api/ok', (_req, res) => res.json({ ok: true }))
        app.use((err: Error, _req: any, res: any, _next: any) => {
            res.status(503).json({ error: err.message })
        })

        const res = await supertest(app).get('/api/ok')
        expect(res.status).toBe(503)
        expect(res.body).toEqual({ error: 'redis down' })
    })

    it('uses req.ip and honors trust proxy for identifier resolution', async () => {
        const ipLimiter = await fixedWindow({ limit: 1, windowMs: WINDOW_MS, prefix: 'express-ip' })
        const app = deps.app()
        app.set('trust proxy', true)
        app.use('/api', rateLimit({ limiter: ipLimiter }))
        app.get('/api/ok', (_req, res) => res.json({ ok: true }))

        const clientA = await supertest(app).get('/api/ok').set('x-forwarded-for', '203.0.113.10')
        const clientAAgain = await supertest(app)
            .get('/api/ok')
            .set('x-forwarded-for', '203.0.113.10')
        const clientB = await supertest(app).get('/api/ok').set('x-forwarded-for', '203.0.113.11')

        expect(clientA.status).toBe(200)
        expect(clientAAgain.status).toBe(429)
        expect(clientB.status).toBe(200)
        await ipLimiter.destroy?.()
    })
})
