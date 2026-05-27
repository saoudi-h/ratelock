import type { PgDriver } from './drivers/types'

const TABLES = [
    { table: 'ratelock.fixed_window', column: 'expires_at' },
    { table: 'ratelock.sliding_window', column: 'expires_at' },
    { table: 'ratelock.token_bucket', column: 'expires_at' },
    { table: 'ratelock.individual_fixed_window', column: 'expires_at' },
] as const

const CLEANUP_INTERVAL_MS = 300_000

type CleanupHandle = { stop: () => void }

const runners = new WeakMap<PgDriver, CleanupHandle>()

/** Delete expired rows from all rate-limit tables. Returns the total number of rows removed. */
export async function cleanupExpired(driver: PgDriver): Promise<number> {
    let total = 0
    for (const { table, column } of TABLES) {
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

/** Start a periodic cleanup timer. Uses `unref()` so it won't keep the process alive. */
export function startAutoCleanup(driver: PgDriver, disabled?: boolean): CleanupHandle {
    if (disabled || runners.has(driver)) {
        return runners.get(driver) ?? { stop: () => {} }
    }

    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = () => {
        cleanupExpired(driver).catch(() => {})
        timer = setTimeout(tick, CLEANUP_INTERVAL_MS)
        timer.unref()
    }

    // Start first tick after the interval (not immediately)
    timer = setTimeout(tick, CLEANUP_INTERVAL_MS)
    timer.unref()

    const handle: CleanupHandle = {
        stop: () => {
            if (timer) clearTimeout(timer)
            timer = null
            runners.delete(driver)
        },
    }

    runners.set(driver, handle)
    return handle
}
