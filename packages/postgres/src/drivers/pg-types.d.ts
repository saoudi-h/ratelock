declare module 'pg' {
    export class Pool {
        constructor(config: { connectionString?: string })
        query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }>
        end(): Promise<void>
    }
}
