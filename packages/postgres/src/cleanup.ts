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

export async function cleanupExpired(driver: PgDriver): Promise<number> {
  let total = 0
  for (const { table, column } of TABLES) {
    try {
      const rows = await driver.query<{ key: string }>(
        `DELETE FROM ${table} WHERE ${column} < NOW() - INTERVAL '1 hour' RETURNING key`,
      )
      total += rows.length
    } catch {
      // cleanup is best-effort
    }
  }
  return total
}

export function startAutoCleanup(driver: PgDriver, disabled?: boolean): CleanupHandle {
  if (disabled || runners.has(driver)) {
    return { stop: () => {} }
  }

  let running = true

  const loop = async () => {
    while (running) {
      await new Promise((r) => setTimeout(r, CLEANUP_INTERVAL_MS))
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!running) break
      await cleanupExpired(driver).catch(() => {})
    }
  }

  loop()

  const handle: CleanupHandle = {
    stop: () => {
      running = false
      runners.delete(driver)
    },
  }

  runners.set(driver, handle)
  return handle
}
