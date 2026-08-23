import type { BaseResult, Limiter } from '@ratelock/core'
import type { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Which rate limit header families to attach to responses.
 *
 * - `'both'`: RFC 9331 (`RateLimit-*`) and the widely supported legacy
 *   `X-RateLimit-*` family. Best client compatibility.
 * - `'rfc'`: only the standard `RateLimit-*` headers.
 * - `'legacy'`: only `X-RateLimit-*`.
 * - `false`: no rate limit headers at all.
 */
export type HeadersMode = 'both' | 'rfc' | 'legacy' | false

/** A limiter instance, or a lazy factory invoked once on the first matched request. */
export type LimiterInput<T extends BaseResult> =
    Limiter<T> | (() => Limiter<T> | Promise<Limiter<T>>)

export interface RateLimitOptions<T extends BaseResult = BaseResult> {
    /**
     * The RateLock limiter enforcing the quota. Any engine works
     * (`@ratelock/local`, `@ratelock/redis`, `@ratelock/postgres`), decorated
     * or not. Pass a factory instead of an instance to defer engine
     * initialization until the first matched request.
     */
    limiter: LimiterInput<T>
    /**
     * Resolves the identifier a request is counted against. Defaults to
     * `req.ip`, which respects the app's `trust proxy` setting, falling back
     * to a single shared `'anonymous'` bucket when the address is unknown.
     */
    keyGenerator?: (req: Request) => string | Promise<string>
    /** Header families attached to every handled response. Default `'both'`. */
    headers?: HeadersMode
    /**
     * The configured quota, used only to emit the `*Limit` headers; results
     * do not carry it. Omit to skip those two headers.
     */
    limit?: number
    /** Status code returned when the quota is exhausted. Default `429`. */
    denyStatusCode?: number
    /** JSON body sent with the denial response. */
    message?: string
}

interface HeaderInfo {
    remaining: number | null
    resetSeconds: number | null
}

const EPOCH_MS_THRESHOLD = 1e12

function createResolver<T extends BaseResult>(input: LimiterInput<T>): () => Promise<Limiter<T>> {
    if (typeof input === 'function') {
        let initialized: Promise<Limiter<T>> | null = null
        return () => {
            initialized ??= Promise.resolve().then(input)
            return initialized
        }
    }
    return () => Promise.resolve(input)
}

function secondsUntil(value: number): number {
    if (!Number.isFinite(value) || value <= 0) return 0
    if (value > EPOCH_MS_THRESHOLD) return Math.max(0, Math.ceil((value - Date.now()) / 1000))
    return Math.max(0, Math.ceil(value / 1000))
}

function project(result: Record<string, unknown>): HeaderInfo {
    let remaining: number | null = null
    if (typeof result.remaining === 'number') remaining = result.remaining
    else if (typeof result.tokens === 'number') remaining = Math.floor(result.tokens)

    const rawReset = result.reset ?? result.windowEnd ?? result.refillTime
    const resetSeconds = typeof rawReset === 'number' ? secondsUntil(rawReset) : null

    return { remaining, resetSeconds }
}

function applyHeaders(res: Response, info: HeaderInfo, mode: HeadersMode, limit?: number): void {
    if (mode === false) return
    const rfc = mode === 'both' || mode === 'rfc'
    const legacy = mode === 'both' || mode === 'legacy'

    if (limit != null && Number.isFinite(limit)) {
        if (rfc) res.setHeader('RateLimit-Limit', String(limit))
        if (legacy) res.setHeader('X-RateLimit-Limit', String(limit))
    }
    if (info.remaining != null) {
        if (rfc) res.setHeader('RateLimit-Remaining', String(info.remaining))
        if (legacy) res.setHeader('X-RateLimit-Remaining', String(info.remaining))
    }
    if (info.resetSeconds != null) {
        if (rfc) res.setHeader('RateLimit-Reset', String(info.resetSeconds))
        if (legacy) res.setHeader('X-RateLimit-Reset', String(info.resetSeconds))
    }
}

function defaultKey(req: Request): string {
    return req.ip ?? 'anonymous'
}

/**
 * Express middleware enforcing a RateLock quota on matched routes. Compatible
 * with Express 4 and 5: async failures are always forwarded through `next`,
 * covering Express 4's lack of automatic promise-rejection handling.
 *
 * @example
 * ```ts
 * import express from 'express'
 * import { rateLimit } from '@ratelock/express'
 * import { fixedWindow } from '@ratelock/redis'
 *
 * const app = express()
 *
 * app.use(
 *   '/api',
 *   rateLimit({
 *     limiter: () => fixedWindow({ url: process.env.REDIS_URL!, limit: 100, windowMs: 60_000 }),
 *     keyGenerator: req => (req as any).user?.id ?? req.ip ?? 'anon',
 *   }),
 * )
 * ```
 */
export function rateLimit<T extends BaseResult = BaseResult>(
    options: RateLimitOptions<T>
): RequestHandler {
    const resolveLimiter = createResolver(options.limiter)
    const mode: HeadersMode = options.headers === undefined ? 'both' : options.headers
    const resolveKey = options.keyGenerator ?? defaultKey

    return function rateLimitHandler(req: Request, res: Response, next: NextFunction) {
        void (async () => {
            const limiter = await resolveLimiter()
            const id = await resolveKey(req)
            const result = (await limiter.check(id)) as BaseResult & Record<string, unknown>

            const info = project(result)
            applyHeaders(res, info, mode, options.limit)

            if (!result.allowed) {
                res.statusCode = options.denyStatusCode ?? 429
                if (info.resetSeconds != null)
                    res.setHeader('Retry-After', String(info.resetSeconds))
                res.json({ error: options.message ?? 'Too Many Requests' })
                return
            }

            next()
        })().catch(next)
    }
}
