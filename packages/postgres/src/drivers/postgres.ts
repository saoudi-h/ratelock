import type { PgDriver } from './types'

 
export function postgresDriver(sql: any): PgDriver {
  return {
    async query<T = unknown>(sqlString: string, params?: unknown[]): Promise<T[]> {
      const result = await sql.unsafe(sqlString, params ?? [])
      return result as T[]
    },
    end() {
      return sql.end()
    },
  }
}
