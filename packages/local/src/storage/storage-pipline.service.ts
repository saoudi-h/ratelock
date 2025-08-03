import type { StoragePipeline } from '@ratelock/core/storage'
import type { StorageService } from './storage.service'

export class StoragePipelineService implements StoragePipeline {
    private commands: Array<() => Promise<unknown>> = []

    constructor(private storage: StorageService) {}
    incrementIf(key: string, maxValue: number, ttlMs?: number | undefined): Promise<this> {
        this.commands.push(() => this.storage.incrementIf(key, maxValue, ttlMs))
        return Promise.resolve(this)
    }
    decrement(key: string, minValue?: number | undefined): Promise<this> {
        this.commands.push(() => this.storage.decrement(key, minValue))
        return Promise.resolve(this)
    }
    get(key: string): Promise<this> {
        this.commands.push(() => this.storage.get(key))
        return Promise.resolve(this)
    }
    set(key: string, value: string, ttlMs?: number | undefined): Promise<this> {
        this.commands.push(() => this.storage.set(key, value, ttlMs))
        return Promise.resolve(this)
    }

    increment(key: string, ttlMs?: number): Promise<this> {
        this.commands.push(() => this.storage.increment(key, ttlMs))
        return Promise.resolve(this)
    }

    addTimestamp(identifier: string, timestamp: number, ttlMs: number): Promise<this> {
        this.commands.push(() => this.storage.addTimestamp(identifier, timestamp, ttlMs))
        return Promise.resolve(this)
    }

    countTimestamps(identifier: string, windowMs: number): Promise<this> {
        this.commands.push(() => this.storage.countTimestamps(identifier, windowMs))
        return Promise.resolve(this)
    }

    getOldestTimestamp(identifier: string): Promise<this> {
        this.commands.push(() => this.storage.getOldestTimestamp(identifier))
        return Promise.resolve(this)
    }

    expire(keyOrIdentifier: string, ttlMs: number): Promise<this> {
        this.commands.push(() => this.storage.expire(keyOrIdentifier, ttlMs))
        return Promise.resolve(this)
    }

    async exec(): Promise<unknown[]> {
        const results = []
        for (const cmd of this.commands) {
            results.push(await cmd())
        }
        return results
    }
}
