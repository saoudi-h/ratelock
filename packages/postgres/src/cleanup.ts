import type { PgDriver } from './drivers/types'

/**
 * Two classes of cleanup targets:
 *
 * - COUNTER-style tables (fixed_window, token_bucket, individual_fixed_window):
 *   prune when `expires_at` is more than 1 hour past. Plenty of headroom.
 *
 * - LOG-style tables (sliding_window): one row per request, so the table can
 *   grow to millions of rows if not pruned aggressively. We prune entries
 *   whose `ts` is older than `windowMs` past — those can never again be in
 *   any active window. This matches the inline DELETE the previous
 *   counter-based UPSERT did, just done async to keep `check()` fast.
 */
const COUNTER_TABLES = [
    { table: 'ratelock.fixed_window', column: 'expires_at' },
    { table: 'ratelock.token_bucket', column: 'expires_at' },
    { table: 'ratelock.individual_fixed_window', column: 'expires_at' },
] as const

const LOG_TABLES = [{ table: 'ratelock.sliding_window', column: 'ts' }] as const

const COUNTER_CLEANUP_INTERVAL_MS = 300_000
const LOG_CLEANUP_INTERVAL_MS = 30_000

type CleanupHandle = { stop: () => void }

const runners = new WeakMap<PgDriver, CleanupHandle>()

async function cleanupCounterTables(driver: PgDriver): Promise<number> {
    let total = 0
    for (const { table, column } of COUNTER_TABLES) {
        try {
            const rows = await driver.query(
                `DELETE FROM ${table} WHERE ${column} < NOW() - INTERVAL '1 hour' RETURNING 1`
            )
            total += rows.length
        } catch {
            // cleanup is best-effort
        }
    }
    return total
}

/** Delete entries whose timestamp is older than `windowMs` milliseconds. */
async function cleanupLogTable(driver: PgDriver, windowMs: number): Promise<number> {
    let total = 0
    for (const { table, column } of LOG_TABLES) {
        try {
            const rows = await driver.query(
                `DELETE FROM ${table} WHERE ${column} < to_timestamp(($1 / 1000.0))`,
                [Date.now() - windowMs]
            )
            total += rows.length
        } catch {
            // cleanup is best-effort
        }
    }
    return total
}

/** Delete expired rows from all rate-limit tables. Returns the total number of rows removed. */
export async function cleanupExpired(driver: PgDriver, windowMs?: number): Promise<number> {
    const c = await cleanupCounterTables(driver)
    // Without a configured windowMs we can only fall back to the 1h heuristic;
    // callers without it skip the log cleanup (the periodic timer below
    // passes the real value).
    if (!windowMs) return c
    const l = await cleanupLogTable(driver, windowMs)
    return c + l
}

/** Start a periodic cleanup timer. Uses `unref()` so it won't keep the process alive. */
export function startAutoCleanup(driver: PgDriver, windowMs?: number): CleanupHandle {
    if (runners.has(driver)) {
        return runners.get(driver)!
    }

    let counterTimer: ReturnType<typeof setTimeout> | null = null
    let logTimer: ReturnType<typeof setTimeout> | null = null

    const counterTick = () => {
        cleanupCounterTables(driver).catch(() => {})
        counterTimer = setTimeout(counterTick, COUNTER_CLEANUP_INTERVAL_MS)
        counterTimer.unref()
    }
    counterTimer = setTimeout(counterTick, COUNTER_CLEANUP_INTERVAL_MS)
    counterTimer.unref()

    if (windowMs && windowMs > 0) {
        const logTick = () => {
            cleanupLogTable(driver, windowMs).catch(() => {})
            logTimer = setTimeout(logTick, LOG_CLEANUP_INTERVAL_MS)
            logTimer.unref()
        }
        logTimer = setTimeout(logTick, LOG_CLEANUP_INTERVAL_MS)
        logTimer.unref()
    }

    const handle: CleanupHandle = {
        stop: () => {
            if (counterTimer) clearTimeout(counterTimer)
            if (logTimer) clearTimeout(logTimer)
            counterTimer = null
            logTimer = null
            runners.delete(driver)
        },
    }

    runners.set(driver, handle)
    return handle
}
