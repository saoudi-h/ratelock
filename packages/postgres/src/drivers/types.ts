export interface PgDriver {
    query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>
    end(): Promise<void>
}
