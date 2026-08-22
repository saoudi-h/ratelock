import type { BaseResult, Limiter } from '@ratelock/core'
import type { Context, MiddlewareHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

/**
 * Which rate limit header families to attach to responses.
 *
 * - `'both'` — RFC 9331 (`RateLimit-*`) and the widely supported legacy
 *   `X-RateLimit-*` family. Best client compatibility.
 * - `'rfc'` — only the standard `RateLimit-*` headers.
 * - `'legacy'` — only `X-RateLimit-*`.
 * - `false` — no rate limit headers at all.
 */
export type HeadersMode = 'both' | 'rfc' | 'legacy' | false

/** A limiter instance, or a lazy factory invoked once on the first matched request. */
export type LimiterInput<T extends BaseResult> =
    Limiter<T> | (() => Limiter<T> | Promise<Limiter<T>>)

export interface RateLimitOptions<T extends BaseResult = BaseResult> {
    /**
     * The RateLock limiter enforcing the quota — any engine works
     * (`@ratelock/local`, `@ratelock/redis`, `@ratelock/postgres`), decorated
     * or not. Pass a factory instead of an instance to defer engine
     * initialization until the first matched request (edge/cold-start friendly).
     */
    limiter: LimiterInput<T>
    /**
     * Resolves the identifier a request is counted against. Defaults to the
     * framework-provided remote address, falling back to a single shared
     * `'anonymous'` bucket when the runtime exposes no address.
     */
    keyGenerator?: (c: Context) => string | Promise<string>
    /** Header families attached to every handled response. Default `'both'`. */
    headers?: HeadersMode
    /**
     * The configured quota, used only to emit the `*Limit` headers — results
     * do not carry it. Omit to skip those two headers.
     */
    limit?: number
    /** Status code returned when the quota is exhausted. Default `429`. */
    denyStatusCode?: ContentfulStatusCode
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

function applyHeaders(c: Context, info: HeaderInfo, mode: HeadersMode, limit?: number): void {
    if (mode === false) return
    const rfc = mode === 'both' || mode === 'rfc'
    const legacy = mode === 'both' || mode === 'legacy'

    if (limit != null && Number.isFinite(limit)) {
        if (rfc) c.header('RateLimit-Limit', String(limit))
        if (legacy) c.header('X-RateLimit-Limit', String(limit))
    }
    if (info.remaining != null) {
        if (rfc) c.header('RateLimit-Remaining', String(info.remaining))
        if (legacy) c.header('X-RateLimit-Remaining', String(info.remaining))
    }
    if (info.resetSeconds != null) {
        if (rfc) c.header('RateLimit-Reset', String(info.resetSeconds))
        if (legacy) c.header('X-RateLimit-Reset', String(info.resetSeconds))
    }
}

/**
 * Best-effort remote address across runtimes: Hono exposes the raw runtime
 * through `c.env`, and each runtime shapes it differently. Returns undefined
 * when nothing is available (edge adapters without connection info).
 */
function remoteAddress(c: Context): string | undefined {
    const env = c.env as
        | {
              raw?: unknown
              incoming?: { socket?: { remoteAddress?: string } }
              server?: { requestIP?: (input: unknown) => { address?: string } | null }
              remoteAddr?: { hostname?: string }
          }
        | undefined
    if (!env) return undefined
    const nodeAddress = env.incoming?.socket?.remoteAddress
    if (nodeAddress) return nodeAddress
    const bunAddress = env.server?.requestIP?.(env.raw)?.address
    if (bunAddress) return bunAddress
    return env.remoteAddr?.hostname
}

async function defaultKey(c: Context): Promise<string> {
    return remoteAddress(c) ?? 'anonymous'
}

/**
 * Hono middleware enforcing a RateLock quota on matched routes.
 *
 * @example
 * ```ts
 * import { Hono } from 'hono'
 * import { rateLimit } from '@ratelock/hono'
 * import { fixedWindow } from '@ratelock/redis'
 *
 * const app = new Hono()
 *
 * app.use(
 *   '/api/*',
 *   rateLimit({
 *     limiter: () => fixedWindow({ url: process.env.REDIS_URL!, limit: 100, windowMs: 60_000 }),
 *     keyGenerator: c => c.req.header('x-user-id') ?? 'anon',
 *   }),
 * )
 * ```
 */
export function rateLimit<T extends BaseResult = BaseResult>(
    options: RateLimitOptions<T>
): MiddlewareHandler {
    const resolveLimiter = createResolver(options.limiter)
    const mode: HeadersMode = options.headers === undefined ? 'both' : options.headers
    const resolveKey = options.keyGenerator ?? defaultKey

    return async (c, next) => {
        const limiter = await resolveLimiter()
        const id = await resolveKey(c)
        const result = (await limiter.check(id)) as BaseResult & Record<string, unknown>

        const info = project(result)
        applyHeaders(c, info, mode, options.limit)

        if (!result.allowed) {
            const retryAfter = info.resetSeconds != null ? String(info.resetSeconds) : undefined
            return c.json(
                { error: options.message ?? 'Too Many Requests' },
                options.denyStatusCode ?? 429,
                retryAfter !== undefined ? { 'Retry-After': retryAfter } : undefined
            )
        }

        await next()
    }
}
