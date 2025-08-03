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

export interface StoragePipeline {
    increment(key: string, ttlMs?: number): Promise<this>
    incrementIf(key: string, maxValue: number, ttlMs?: number): Promise<this>
    decrement(key: string, minValue?: number): Promise<this>
    addTimestamp(identifier: string, timestamp: number, ttlMs: number): Promise<this>
    countTimestamps(identifier: string, windowMs: number): Promise<this>
    getOldestTimestamp(identifier: string): Promise<this>
    expire(keyOrIdentifier: string, ttlMs: number): Promise<this>
    get(key: string): Promise<this>
    set(key: string, value: string, ttlMs?: number): Promise<this>

    exec(): Promise<unknown[]>
}
