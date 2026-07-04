export const TABLE = 'ratelock.individual_fixed_window'

export function buildKey(prefix: string, id: string): string {
    return `${prefix}:${id}`
}

export type IndividualFixedWindowCheckResult = {
    allowed: boolean
    remaining: number
    reset: number
}

export function parseIndividualRow(row: {
    count: number
    window_start: string
    expires_at: string
}): { count: number; windowStartMs: number } {
    return {
        count: row.count,
        windowStartMs: new Date(row.window_start).getTime(),
    }
}

export function buildResult(
    count: number,
    windowStartMs: number,
    windowMs: number,
    limit: number
): IndividualFixedWindowCheckResult {
    return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        reset: windowStartMs + windowMs,
    }
}
