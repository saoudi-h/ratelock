import type { PgDriver } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pgDriver(pool: any): PgDriver {
  return {
    async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
      const result = await pool.query(sql, params)
      return result.rows as T[]
    },
    end() {
      return pool.end()
    },
  }
}
