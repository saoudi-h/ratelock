import type { PgDriver } from './types'

function sqlName(sql: string): string {
    let hash = 0x811c9dc5
    for (let i = 0; i < sql.length; i++) {
        hash ^= sql.charCodeAt(i)
        hash = Math.imul(hash, 0x01000193) >>> 0
    }
    return `rl_${hash.toString(36)}`
}

export function pgDriver(pool: any): PgDriver {
    return {
        async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
            const result = await pool.query({
                name: sqlName(sql),
                text: sql,
                values: params as any[],
            })
            return result.rows as T[]
        },
        end() {
            return pool.end()
        },
    }
}
