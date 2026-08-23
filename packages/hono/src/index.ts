import type { BaseResult, Limiter } from '@ratelock/core'
import {
    collectRateLimitHeaders,
    createLimiterResolver,
    projectResult,
} from '@ratelock/http-common'
import type { Context, MiddlewareHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

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
     * Resolves the identifier a request is counted against. Defaults to the
     * framework-provided remote address, falling back to a single shared
     * `'anonymous'` bucket when the runtime exposes no address.
     */
    keyGenerator?: (c: Context) => string | Promise<string>
    /** Header families attached to every handled response. Default `'both'`. */
    headers?: HeadersMode
    /**
     * The configured quota, used only to emit the `*Limit` headers; results
     * do not carry it. Omit to skip those two headers.
     */
    limit?: number
    /** Status code returned when the quota is exhausted. Default `429`. */
    denyStatusCode?: ContentfulStatusCode
    /** JSON body sent with the denial response. */
    message?: string
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
    const resolveLimiter = createLimiterResolver(options.limiter)
    const mode = options.headers === undefined ? ('both' as const) : options.headers
    const resolveKey = options.keyGenerator ?? defaultKey

    return async (c, next) => {
        const limiter = await resolveLimiter()
        const id = await resolveKey(c)
        const result = (await limiter.check(id)) as BaseResult & Record<string, unknown>

        const info = projectResult(result)
        const headers = collectRateLimitHeaders(info, mode, options.limit)
        for (const [name, value] of Object.entries(headers)) c.header(name, value)

        if (!result.allowed) {
            const retryAfter =
                info.resetSeconds != null ? { 'Retry-After': String(info.resetSeconds) } : undefined
            return c.json(
                { error: options.message ?? 'Too Many Requests' },
                options.denyStatusCode ?? 429,
                retryAfter
            )
        }

        await next()
    }
}
