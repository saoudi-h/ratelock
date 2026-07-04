export interface BenchmarkAdapter {
    name: string
    // Initialize connection, drop/create tables, run migrations, set tables to UNLOGGED, etc.
    initialize(): Promise<void>
    // Perform the rate limit check
    check(key: string | string[]): Promise<{ allowed: boolean }>
    // Clean up connections, close pools, release handles
    destroy(): Promise<void>
}
