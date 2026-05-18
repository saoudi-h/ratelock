import type { PgDriver } from './types'
import { postgresDriver } from './postgres'
import { pgDriver } from './pg'

export type { PgDriver } from './types'
export { postgresDriver } from './postgres'
export { pgDriver } from './pg'

function isPgDriver(obj: unknown): obj is PgDriver {
  return typeof obj === 'object' && obj !== null && 'query' in obj
}

export async function createConnection(config: {
  sql?: unknown
  pool?: unknown
  connectionString?: string
  driver?: 'postgres' | 'pg'
}): Promise<{ driver: PgDriver; end: () => Promise<void> }> {
  if (config.sql) {
    if (isPgDriver(config.sql)) {
      return { driver: config.sql, end: async () => {} }
    }
    return {
      driver: postgresDriver(config.sql as any),
      end: async () => {},
    }
  }

  if (config.pool) {
    return {
      driver: pgDriver(config.pool as any),
      end: async () => {},
    }
  }

  if (config.connectionString) {
    const driver = config.driver ?? 'postgres'
    if (driver === 'postgres') {
      try {
        const mod = await import('postgres')
        const postgres = mod.default ?? mod
        const sql = postgres(config.connectionString)
        return { driver: postgresDriver(sql), end: () => sql.end() }
      } catch {
        if (config.driver === 'postgres') throw new Error('postgres (porsager) package not found')
      }
    }
    if (driver === 'pg') {
      try {
        const pg = await import('pg')
        const Pool = pg.default?.Pool ?? pg.Pool
        const pool = new Pool({ connectionString: config.connectionString })
        return { driver: pgDriver(pool), end: () => pool.end() }
      } catch {
        if (config.driver === 'pg') throw new Error('pg package not found')
      }
    }
    throw new Error(
      'No PostgreSQL client found. Install postgres or pg:\n' +
      '  npm install postgres\n' +
      '  npm install pg'
    )
  }

  throw new Error(
    'Provide a PostgreSQL client or connection string:\n' +
    '  createFixedWindowLimiter({ sql: postgresClient, ... })\n' +
    '  createFixedWindowLimiter({ pool: pgPool, ... })\n' +
    '  createFixedWindowLimiter({ connectionString: "postgres://...", ... })'
  )
}
