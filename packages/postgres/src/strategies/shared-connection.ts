import { postgresDriver } from '../drivers'
import type { PostgresLimiterBaseConfig } from '../types'

function isRawPostgresClient(sql: any): boolean {
    return (
        (typeof sql === 'object' || typeof sql === 'function') &&
        sql !== null &&
        typeof sql.unsafe === 'function'
    )
}

export interface ConnectionResult {
    mode: 'pg' | 'postgres'
    driver: any
    sql: any
    end: () => Promise<void>
}

export async function detectAndCreate(
    config: PostgresLimiterBaseConfig
): Promise<ConnectionResult> {
    if (config.sql && isRawPostgresClient(config.sql)) {
        return {
            mode: 'postgres',
            driver: postgresDriver(config.sql),
            sql: config.sql,
            end: async () => {},
        }
    }

    if (config.url) {
        const driver = config.driver ?? 'postgres'
        if (driver === 'postgres') {
            try {
                const mod = await import('postgres')
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                const sql = (mod.default ?? mod)(config.url)
                return { mode: 'postgres', driver: postgresDriver(sql), sql, end: () => sql.end() }
            } catch {
                if (config.driver === 'postgres') throw new Error('postgres package not found')
            }
        }
    }

    const { createConnection } = await import('../drivers')
    const conn = await createConnection(config)
    return { mode: 'pg', driver: conn.driver, sql: null, end: conn.end }
}
