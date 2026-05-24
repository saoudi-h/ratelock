import type { PostgresLimiterBaseConfig } from '../types'
import { pgDriver } from './pg'
import { postgresDriver } from './postgres'
import type { PgDriver } from './types'

export { pgDriver } from './pg'
export { postgresDriver } from './postgres'
export type { PgDriver } from './types'

function isPgDriver(obj: unknown): obj is PgDriver {
    return typeof obj === 'object' && obj !== null && 'query' in obj
}

export async function createConnection(
    config: PostgresLimiterBaseConfig
): Promise<{ driver: PgDriver; end: () => Promise<void> }> {
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

    const pgConnectionString = config.connectionString ?? config.url
    if (pgConnectionString) {
        const driver = config.driver ?? 'postgres'
        if (driver === 'postgres') {
            try {
                const mod = await import('postgres')
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                const sql = (mod.default ?? mod)(pgConnectionString)
                return { driver: postgresDriver(sql), end: () => sql.end() }
            } catch {
                if (config.driver === 'postgres')
                    throw new Error('postgres (porsager) package not found')
            }
        }
        if (driver === 'pg') {
            try {
                const pg = await import('pg')
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                const Pool = (pg.default ?? pg).Pool
                const pool = new Pool({ connectionString: pgConnectionString })
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
            '  fixedWindow({ sql: postgresClient, ... })\n' +
            '  fixedWindow({ pool: pgPool, ... })\n' +
            '  fixedWindow({ connectionString: "postgres://...", ... })'
    )
}
