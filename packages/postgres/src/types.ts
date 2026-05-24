import type { CacheConfig, CircuitBreakerConfig, FallbackPolicy, RetryConfig } from '@ratelock/core'

/** Représente la structure minimale et stricte attendue d'un client postgres.js */
export interface PostgresSqlLike {
    unsafe<T = any>(sql: string, params?: any[]): Promise<T[]>
    end(): Promise<void>
}

/** Représente la structure minimale et stricte attendue d'un pool pg */
export interface PgPoolLike {
    query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }>
    end(): Promise<void>
}

/** Représente la structure minimale d'un driver Pg interne ou mocké */
export interface PgDriverLike {
    query<T = any>(sql: string, params?: any[]): Promise<T[]>
    end(): Promise<void>
}

/** Base configuration options for all PostgreSQL-backed rate limiters. */
export type PostgresLimiterBaseConfig = {
    /**
     * An active postgres.js SQL client instance or custom driver.
     * If provided, the limiter will reuse it.
     */
    sql?: PostgresSqlLike | PgDriverLike
    /**
     * An active pg.Pool connection pool instance.
     * If provided, the limiter will reuse it.
     */
    pool?: PgPoolLike
    /**
     * PostgreSQL connection string (e.g., `postgres://user:pass@localhost:5432/mydb`).
     * Interchangeable with `url`.
     */
    connectionString?: string
    /**
     * PostgreSQL connection URL.
     * Interchangeable with `connectionString`.
     */
    url?: string
    /**
     * Explicitly specify the underlying driver: `'postgres'` (postgres.js) or `'pg'`.
     * Automatically detected if omitted.
     */
    driver?: 'postgres' | 'pg'
    /** If `true`, skips automatic table creation and migrations on startup. */
    skipMigrations?: boolean
    /** If `true`, creates tables as `UNLOGGED` for maximum write performance. */
    unlogged?: boolean
    /** Table key prefix to avoid conflicts (default: strategy-specific like `'fw'`). */
    prefix?: string
    /** Built-in in-memory denial cache configuration. */
    cache?: CacheConfig
    /** Built-in retry policy configuration for transient Postgres errors. */
    retry?: RetryConfig
    /** Built-in circuit breaker configuration. */
    circuitBreaker?: CircuitBreakerConfig
    /** Built-in fallback policy behavior when the database is unavailable. */
    fallback?: FallbackPolicy
}
export type { CacheConfig, CircuitBreakerConfig, FallbackPolicy, RetryConfig }
