import type { BaseResult, Limiter } from '@ratelock/core'

import type { PlatformRequest } from './platform'

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
    | Limiter<T>
    | (() => Limiter<T> | Promise<Limiter<T>>)

export interface RatelockModuleOptions<T extends BaseResult = BaseResult> {
    /**
     * The RateLock limiter enforcing the quota. Any engine works
     * (`@ratelock/local`, `@ratelock/redis`, `@ratelock/postgres`), decorated
     * or not. Pass a factory instead of an instance to defer engine
     * initialization until the first guarded request.
     */
    limiter: LimiterInput<T>
    /**
     * Resolves the identifier a request is counted against. Defaults to
     * `request.ip`, available on both Express and Fastify adapters and
     * honoring their respective trust-proxy settings. Falls back to a single
     * shared `'anonymous'` bucket when unknown.
     */
    keyGenerator?: (req: PlatformRequest) => string | Promise<string>
    /** Header families attached to every handled response. Default `'both'`. */
    headers?: HeadersMode
    /**
     * The configured quota, used only to emit the `*Limit` headers; results
     * do not carry it. Omit to skip those two headers.
     */
    limit?: number
    /** Status code of the denial exception. Default `429`. */
    denyStatusCode?: number
    /** JSON body carried by the denial exception. */
    message?: string
    /**
     * Registers the guard application-wide through the `APP_GUARD` provider.
     * When omitted, bind `RatelockGuard` per-module or per-route instead.
     * Default `true`.
     */
    globalGuard?: boolean
}
