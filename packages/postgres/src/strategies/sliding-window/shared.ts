export const TABLE = 'ratelock.sliding_window'

export function buildKey(prefix: string, id: string): string {
    return `${prefix}:${id}`
}

export type SlidingWindowCheckResult = {
    allowed: boolean
    remaining: number
    reset: number
    windowStart: number
    windowEnd: number
}

/**
 * Build the result from log-based primitives.
 *
 * - `count`: number of entries currently in the sliding window for this key.
 * - `oldestTsMs`: epoch ms of the oldest entry still within the window.
 *   Mirrors what Redis returns via ZRANGE 0 0 WITHSCORES and local via
 *   `timestamps[0]`.
 * - `nowMs`: current epoch ms at check time.
 * - `windowMs`, `limit`, `allowed`: straight pass-through.
 *
 * Result semantics (matches @ratelock/redis ZSET and @ratelock/local Map):
 * - `windowStart`: oldest request timestamp still in window (or `cutoff` if
 *   the set is empty, like Redis does with `now - windowMs`).
 * - `windowEnd` / `reset`: `oldestTs + windowMs` — the moment the oldest
 *   entry exits the window, freeing a slot.
 * - `remaining`: `limit - count`, clamped at 0.
 */
export function buildResult(
    count: number,
    oldestTsMs: number,
    nowMs: number,
    windowMs: number,
    limit: number,
    allowed: boolean
): SlidingWindowCheckResult {
    const remaining = Math.max(0, limit - count - (allowed ? 1 : 0))
    const windowStart = oldestTsMs > 0 ? oldestTsMs : nowMs - windowMs
    const windowEnd = windowStart + windowMs
    return {
        allowed,
        remaining,
        reset: windowEnd,
        windowStart,
        windowEnd,
    }
}
