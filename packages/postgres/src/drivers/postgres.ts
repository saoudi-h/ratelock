import type { PgDriver } from './types'

export function postgresDriver(sql: any): PgDriver {
    let transaction: any | null = null

    return {
        async query<T = unknown>(sqlString: string, params?: unknown[]): Promise<T[]> {
            const command = sqlString.trim().split(/\s+/, 1)[0]?.toUpperCase()

            if (command === 'BEGIN') {
                transaction = await sql.reserve()
                try {
                    await transaction.unsafe(sqlString, params ?? [])
                    return [] as T[]
                } catch (err) {
                    transaction.release()
                    transaction = null
                    throw err
                }
            }

            const reserved = transaction ?? (await sql.reserve())
            try {
                const result = await reserved.unsafe(sqlString, params ?? [])
                return result as T[]
            } finally {
                if (command === 'COMMIT' || command === 'ROLLBACK') {
                    reserved.release()
                    transaction = null
                } else if (!transaction) {
                    reserved.release()
                }
            }
        },
        end() {
            return sql.end()
        },
    }
}
