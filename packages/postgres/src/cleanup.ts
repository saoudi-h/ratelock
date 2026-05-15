import type { PgDriver } from './drivers/types'

const TABLES = [
  { table: 'ratelock.fixed_window', column: 'expires_at' },
  { table: 'ratelock.sliding_window', column: 'expires_at' },
  { table: 'ratelock.token_bucket', column: 'expires_at' },
  { table: 'ratelock.individual_fixed_window', column: 'expires_at' },
] as const

export async function cleanupExpired(driver: PgDriver): Promise<number> {
  let total = 0
  for (const { table, column } of TABLES) {
    const rows = await driver.query<{ key: string }>(
      `DELETE FROM ${table} WHERE ${column} < NOW() RETURNING key`,
    )
    total += rows.length
  }
  return total
}
