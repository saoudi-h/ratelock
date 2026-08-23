import type { BaseResult, Limiter } from '@ratelock/core'
import {
    collectRateLimitHeaders,
    createLimiterResolver,
    projectResult,
} from '@ratelock/http-common'
import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

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
     * `request.ip`, which respects the server's `trustProxy` option, falling
     * back to a single shared `'anonymous'` bucket when unknown.
     */
    keyGenerator?: (request: FastifyRequest) => string | Promise<string>
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

function defaultKey(request: FastifyRequest): string {
    return request.ip
}

async function rateLimitImpl(app: FastifyInstance, options: RateLimitOptions): Promise<void> {
    const resolveLimiter = createLimiterResolver(options.limiter)
    const mode = options.headers === undefined ? ('both' as const) : options.headers
    const resolveKey = options.keyGenerator ?? defaultKey

    app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
        const limiter = await resolveLimiter()
        const id = await resolveKey(request)
        const result = (await limiter.check(id)) as BaseResult & Record<string, unknown>

        const info = projectResult(result)
        const headers = collectRateLimitHeaders(info, mode, options.limit)
        for (const [name, value] of Object.entries(headers)) reply.header(name, value)

        if (!result.allowed) {
            if (info.resetSeconds != null) reply.header('Retry-After', String(info.resetSeconds))
            reply.code(options.denyStatusCode ?? 429)
            reply.send({ error: options.message ?? 'Too Many Requests' })
            return reply
        }
    })
}

/**
 * Fastify plugin enforcing a RateLock quota. Wrapped in fastify-plugin, so it
 * applies to routes registered anywhere in the instance, including child
 * encapsulation scopes. Supports Fastify 4 and 5.
 *
 * @example
 * ```ts
 * import Fastify from 'fastify'
 * import { rateLimit } from '@ratelock/fastify'
 * import { fixedWindow } from '@ratelock/redis'
 *
 * const app = Fastify({ trustProxy: true })
 *
 * await app.register(rateLimit, {
 *   limiter: () => fixedWindow({ url: process.env.REDIS_URL!, limit: 100, windowMs: 60_000 }),
 *   keyGenerator: request => request.ip,
 * })
 * ```
 */
export const rateLimit: FastifyPluginAsync<RateLimitOptions> = fastifyPlugin(rateLimitImpl, {
    name: '@ratelock/fastify',
    fastify: '>=4 <6',
})
