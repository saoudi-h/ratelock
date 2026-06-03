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

export function parseSlidingRow(row: {
    current_count: number
    previous_count: number
    window_start_ms: string | number
}): { currentCount: number; previousCount: number; windowStart: number } {
    return {
        currentCount: row.current_count,
        previousCount: row.previous_count,
        windowStart:
            typeof row.window_start_ms === 'string'
                ? Number(row.window_start_ms)
                : row.window_start_ms,
    }
}

export function buildResult(
    currentCount: number,
    previousCount: number,
    windowStart: number,
    windowMs: number,
    limit: number,
    nowMs: number
): SlidingWindowCheckResult {
    const elapsed = (nowMs - windowStart) / windowMs
    const estimated = previousCount * (1 - elapsed) + currentCount
    const count = Math.ceil(estimated)
    const allowed = count <= limit
    return {
        allowed,
        remaining: Math.max(0, limit - count),
        reset: windowStart + windowMs * 2,
        windowStart,
        windowEnd: windowStart + windowMs,
    }
}
