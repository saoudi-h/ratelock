import type { INestApplication } from '@nestjs/common'
import { Controller, Get, Injectable, Module } from '@nestjs/common'
import { FastifyAdapter } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { fixedWindow } from '@ratelock/local'
import 'reflect-metadata'
import supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RatelockModule, SkipRateLimit } from '../src/index'

const LIMIT = 3
const WINDOW_MS = 60_000

type RequestFn = (
    url: string,
    headers?: Record<string, string>
) => Promise<{ status: number; headers: Record<string, string>; body: unknown }>

@Controller('api')
class ApiController {
    @Get('ok')
    ok() {
        return { ok: true }
    }

    @Get('skipped')
    @SkipRateLimit()
    skipped() {
        return { skipped: true }
    }
}

@Module({ controllers: [ApiController] })
class ApiModule {}

@Injectable()
class FakeConfigService {
    get(key: string): number {
        return key === 'RATE_LIMIT' ? LIMIT : 0
    }
}

@Module({
    providers: [FakeConfigService],
    exports: [FakeConfigService],
})
class ConfigTestModule {}

interface AdapterLeg {
    name: string
    /** Boots an app around the testing module and returns a normalized GET fn. */
    mount: (moduleRef: any) => Promise<RequestFn>
}

const adapters: AdapterLeg[] = [
    {
        name: 'express adapter',
        mount: async moduleRef => {
            const app: INestApplication = moduleRef.createNestApplication()
            await app.init()
            const server = app.getHttpServer()
            return (url, headers) =>
                supertest(server)
                    .get(url)
                    .set(headers ?? {}) as unknown as Promise<{
                    status: number
                    headers: Record<string, string>
                    body: unknown
                }>
        },
    },
    {
        name: 'fastify adapter',
        mount: async moduleRef => {
            const app = moduleRef.createNestApplication(
                new FastifyAdapter()
            ) as INestApplication & {
                inject: (opts: {
                    method: 'GET'
                    url: string
                    headers?: Record<string, string>
                }) => Promise<{
                    statusCode: number
                    headers: Record<string, string>
                    json: () => unknown
                }>
            }
            await app.init()
            return async (url, headers) => {
                const res = await app.inject({ method: 'GET', url, headers })
                return { status: res.statusCode, headers: res.headers, body: res.json() }
            }
        },
    },
]

describe.each(adapters.map(a => [a.name, a] as const))('RatelockGuard (%s)', (_name, leg) => {
    let limiter: Awaited<ReturnType<typeof fixedWindow>>

    beforeEach(async () => {
        limiter = await fixedWindow({ limit: LIMIT, windowMs: WINDOW_MS, prefix: 'nestjs-test' })
    })

    afterEach(async () => {
        await limiter.destroy?.()
    })

    async function boot(
        options?: Omit<Parameters<typeof RatelockModule.forRoot>[0], 'limiter'>
    ): Promise<RequestFn> {
        const moduleRef = await Test.createTestingModule({
            imports: [RatelockModule.forRoot({ limiter, limit: LIMIT, ...options }), ApiModule],
        }).compile()
        return leg.mount(moduleRef)
    }

    it('allows requests within the limit and emits both header families', async () => {
        const req = await boot()
        const res = await req('/api/ok')
        expect(res.status).toBe(200)
        expect(res.headers['x-ratelimit-remaining']).toBe(String(LIMIT - 1))
        expect(res.headers['ratelimit-remaining']).toBe(String(LIMIT - 1))
        expect(res.headers['x-ratelimit-limit']).toBe(String(LIMIT))
    })

    it('denies with 429, JSON body and Retry-After once exhausted', async () => {
        const req = await boot()
        for (let i = 0; i < LIMIT; i++) {
            const res = await req('/api/ok')
            expect(res.status).toBe(200)
        }
        const denied = await req('/api/ok')
        expect(denied.status).toBe(429)
        expect(denied.body).toEqual({ error: 'Too Many Requests' })
        const retryAfter = Number(denied.headers['retry-after'])
        expect(retryAfter).toBeGreaterThan(0)
        expect(retryAfter).toBeLessThanOrEqual(WINDOW_MS / 1000)
        expect(denied.headers['x-ratelimit-remaining']).toBe('0')
    })

    it('supports custom denial status code and message', async () => {
        const req = await boot({ denyStatusCode: 418, message: 'slow down' })
        for (let i = 0; i < LIMIT; i++) await req('/api/ok')
        const denied = await req('/api/ok')
        expect(denied.status).toBe(418)
        expect(denied.body).toEqual({ error: 'slow down' })
    })

    it('bypasses routes marked with @SkipRateLimit', async () => {
        const req = await boot()
        for (let i = 0; i < LIMIT; i++) await req('/api/ok')
        expect((await req('/api/ok')).status).toBe(429)
        const skipped = await req('/api/skipped')
        expect(skipped.status).toBe(200)
        expect(skipped.headers['x-ratelimit-remaining']).toBeUndefined()
    })

    it('isolates identifiers through keyGenerator', async () => {
        const keyedLimiter = await fixedWindow({
            limit: 1,
            windowMs: WINDOW_MS,
            prefix: 'nestjs-keyed',
        })
        const moduleRef = await Test.createTestingModule({
            imports: [
                RatelockModule.forRoot({
                    limiter: keyedLimiter,
                    keyGenerator: req => (req.headers['x-user'] as string | undefined) ?? 'anon',
                }),
                ApiModule,
            ],
        }).compile()
        const req = await leg.mount(moduleRef)

        const first = await req('/api/ok', { 'x-user': 'alice' })
        const second = await req('/api/ok', { 'x-user': 'alice' })
        const other = await req('/api/ok', { 'x-user': 'bob' })

        expect(first.status).toBe(200)
        expect(second.status).toBe(429)
        expect(other.status).toBe(200)
        await keyedLimiter.destroy?.()
    })

    it('emits only RFC family with headers: rfc', async () => {
        const req = await boot({ headers: 'rfc' })
        const res = await req('/api/ok')
        expect(res.headers['ratelimit-remaining']).not.toBeNull()
        expect(res.headers['x-ratelimit-remaining']).toBeUndefined()
    })

    it('accepts a lazy factory and defers initialization to the first guarded request', async () => {
        const factory = vi.fn(async () =>
            fixedWindow({ limit: LIMIT, windowMs: WINDOW_MS, prefix: 'nestjs-lazy' })
        )
        const moduleRef = await Test.createTestingModule({
            imports: [RatelockModule.forRoot({ limiter: factory, limit: LIMIT }), ApiModule],
        }).compile()
        const req = await leg.mount(moduleRef)

        expect(factory).not.toHaveBeenCalled()

        const res = await req('/api/ok')
        expect(res.status).toBe(200)
        expect(factory).toHaveBeenCalledTimes(1)

        const again = await req('/api/ok')
        expect(again.status).toBe(200)
        expect(factory).toHaveBeenCalledTimes(1)
    })

    it('resolves options asynchronously through forRootAsync + inject', async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                RatelockModule.forRootAsync({
                    imports: [ConfigTestModule],
                    inject: [FakeConfigService],
                    useFactory: async (config: FakeConfigService) => ({
                        limiter,
                        limit: config.get('RATE_LIMIT'),
                    }),
                }),
                ApiModule,
            ],
        }).compile()
        const req = await leg.mount(moduleRef)

        const res = await req('/api/ok')
        expect(res.status).toBe(200)
        expect(res.headers['x-ratelimit-remaining']).toBe(String(LIMIT - 1))
    })
})
