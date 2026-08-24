import type { BaseResult, Limiter } from '@ratelock/core'
import {
    collectRateLimitHeaders,
    createLimiterResolver,
    projectResult,
} from '@ratelock/http-common'
import type { Elysia } from 'elysia'

export type HeadersMode = 'both' | 'rfc' | 'legacy' | false

/** A limiter instance, or a lazy factory invoked once on the first matched request. */
export type LimiterInput<T extends BaseResult> =
    | Limiter<T>
    | (() => Limiter<T> | Promise<Limiter<T>>)

export interface RateLimitOptions<T extends BaseResult = BaseResult> {
    /**
     * The RateLock limiter enforcing the quota. Any engine works
     * (`@ratelock/local`, `@ratelock/redis`, `@ratelock/postgres`), decorated
     * or not. Pass a factory instead of an instance to defer engine
     * initialization until the first matched request.
     */
    limiter: LimiterInput<T>
    /**
     * Resolves the identifier a request is counted against. Receives the
     * Elysia context. Defaults to the Bun server's `requestIP` when available,
     * falling back to a single shared `'anonymous'` bucket otherwise.
     */
    keyGenerator?: (context: { request: Request }) => string | Promise<string>
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

interface HookContext {
    request: Request
    set: {
        headers: Record<string, unknown>
        status?: number | string
    }
    server?: { requestIP?: (input: unknown) => { address?: string } | null }
}

function defaultKey(context: HookContext): string {
    const address = context.server?.requestIP?.(context.request)?.address
    return address ?? 'anonymous'
}

/**
 * Elysia plugin enforcing a RateLock quota through a global `onBeforeHandle`
 * hook. Applies to every route of the instance it is mounted on. Designed for
 * Bun-first deployments and pairs well with the native Bun Redis driver of
 * `@ratelock/redis`.
 *
 * @example
 * ```ts
 * import { Elysia } from 'elysia'
 * import { rateLimit } from '@ratelock/elysia'
 * import { fixedWindow } from '@ratelock/redis'
 *
 * const app = new Elysia().use(
 *   rateLimit({
 *     limiter: () => fixedWindow({ url: process.env.REDIS_URL!, limit: 100, windowMs: 60_000 }),
 *     keyGenerator: ({ request }) => request.headers.get('x-user-id') ?? 'anon',
 *   }),
 * )
 * ```
 */
export function rateLimit<T extends BaseResult = BaseResult>(
    options: RateLimitOptions<T>
): (app: Elysia) => Elysia {
    const resolveLimiter = createLimiterResolver(options.limiter)
    const mode = options.headers === undefined ? ('both' as const) : options.headers
    const resolveKey = options.keyGenerator ?? ((context: HookContext) => defaultKey(context))

    return app =>
        // Elysia's phantom generics mutate on hook registration; the loose
        // instance shape is the documented plugin contract.
        app.onBeforeHandle({ as: 'global' }, async (context: HookContext) => {
            const limiter = await resolveLimiter()
            const id = await resolveKey(context)
            const result = (await limiter.check(id)) as BaseResult & Record<string, unknown>

            const info = projectResult(result)
            const headers = collectRateLimitHeaders(info, mode, options.limit)
            for (const [name, value] of Object.entries(headers)) context.set.headers[name] = value

            if (!result.allowed) {
                if (info.resetSeconds != null) {
                    context.set.headers['Retry-After'] = String(info.resetSeconds)
                }
                context.set.status = options.denyStatusCode ?? 429
                return { error: options.message ?? 'Too Many Requests' }
            }
        }) as unknown as Elysia
}
