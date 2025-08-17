export interface StoragePipeline {
    increment(key: string, ttlMs?: number): this
    incrementIf(key: string, maxValue: number, ttlMs?: number): this
    decrement(key: string, minValue?: number): this
    addTimestamp(identifier: string, timestamp: number, ttlMs: number): this
    countTimestamps(identifier: string, windowMs: number): this
    getOldestTimestamp(identifier: string): this
    expire(keyOrIdentifier: string, ttlMs: number): this
    get(key: string): this
    set(key: string, value: string, ttlMs?: number): this
    exec(): Promise<unknown[]>
}

export interface Storage {
    get(key: string): Promise<string | null>
    set(key: string, value: string, ttlMs?: number): Promise<void>
    delete(key: string): Promise<void>
    exists(key: string): Promise<boolean>
    expire(keyOrIdentifier: string, ttlMs: number): Promise<void>

    increment(key: string, ttlMs?: number): Promise<number>

    incrementIf(
        key: string,
        maxValue: number,
        ttlMs?: number
    ): Promise<{
        value: number
        incremented: boolean
    }>

    decrement(key: string, minValue?: number): Promise<number>

    addTimestamp(identifier: string, timestamp: number, ttlMs: number): Promise<void>
    countTimestamps(identifier: string, windowMs: number): Promise<number>
    getOldestTimestamp(identifier: string): Promise<number | null>

    cleanupTimestamps(identifier: string): Promise<void>

    pipeline(): StoragePipeline

    multiGet(keys: string[]): Promise<(string | null)[]>
    multiSet(entries: Array<{ key: string; value: string; ttlMs?: number }>): Promise<void>
}
