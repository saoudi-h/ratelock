export const TABLE = 'ratelock.fixed_window'

export function buildKey(prefix: string, id: string): string {
    return `${prefix}:${id}`
}

export function computeNextWindowStartMs(windowMs: number): number {
    return (Math.floor(Date.now() / windowMs) + 1) * windowMs
}

export function parseRow(row: { count: number; reset_ms: string | number }): {
    count: number
    resetMs: number
} {
    return {
        count: row.count,
        resetMs: typeof row.reset_ms === 'string' ? Number(row.reset_ms) : row.reset_ms,
    }
}

export function parseBatchRow(row: { key: string; count: number; reset_ms: string | number }): {
    key: string
    count: number
    resetMs: number
} {
    return {
        key: row.key,
        count: row.count,
        resetMs: typeof row.reset_ms === 'string' ? Number(row.reset_ms) : row.reset_ms,
    }
}
