import type { BaseResult, Limiter } from '@ratelock/core'

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

export interface HeaderInfo {
    remaining: number | null
    resetSeconds: number | null
}

const EPOCH_MS_THRESHOLD = 1e12

/**
 * Normalizes a limiter input into a stable async accessor. Instances pass
 * through; factories are memoized so the engine initializes exactly once,
 * on the first matched request.
 */
export function createLimiterResolver<T extends BaseResult>(
    input: LimiterInput<T>
): () => Promise<Limiter<T>> {
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

/**
 * Projects any strategy result onto normalized header info. Window results
 * contribute their own remaining; token bucket projects floor(tokens). Reset
 * prefers epoch fields (`reset`, `windowEnd`) then durations (`refillTime`),
 * always expressed in seconds from now.
 */
export function projectResult(result: Record<string, unknown>): HeaderInfo {
    let remaining: number | null = null
    if (typeof result.remaining === 'number') remaining = result.remaining
    else if (typeof result.tokens === 'number') remaining = Math.floor(result.tokens)

    const rawReset = result.reset ?? result.windowEnd ?? result.refillTime
    const resetSeconds = typeof rawReset === 'number' ? secondsUntil(rawReset) : null

    return { remaining, resetSeconds }
}

/**
 * Collects the header name/value pairs for a response according to the
 * selected family mode. Adapters apply them with their framework setter.
 */
export function collectRateLimitHeaders(
    info: HeaderInfo,
    mode: HeadersMode,
    limit?: number
): Record<string, string> {
    if (mode === false) return {}
    const rfc = mode === 'both' || mode === 'rfc'
    const legacy = mode === 'both' || mode === 'legacy'

    const headers: Record<string, string> = {}
    const set = (name: string, value: string) => {
        headers[name] = value
    }

    if (limit != null && Number.isFinite(limit)) {
        if (rfc) set('RateLimit-Limit', String(limit))
        if (legacy) set('X-RateLimit-Limit', String(limit))
    }
    if (info.remaining != null) {
        if (rfc) set('RateLimit-Remaining', String(info.remaining))
        if (legacy) set('X-RateLimit-Remaining', String(info.remaining))
    }
    if (info.resetSeconds != null) {
        if (rfc) set('RateLimit-Reset', String(info.resetSeconds))
        if (legacy) set('X-RateLimit-Reset', String(info.resetSeconds))
    }
    return headers
}
