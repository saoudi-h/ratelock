import type { Storage, StoragePipeline } from '@ratelock/core/storage'
import { StoragePipelineService } from './storage-pipline.service'

export class StorageService implements Storage {
    private store = new Map<string, string>()
    private expirations = new Map<string, number>()
    private timestampsStore = new Map<string, Array<{ timestamp: number; expiresAt: number }>>()
    private cleanupInterval: NodeJS.Timeout | null = null
    private readonly CLEANUP_INTERVAL_MS: number = 1000 // 1 seconde

    constructor() {
        this.startCleanupTask()
    }

    private startCleanupTask(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval)
        }
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredEntries()
        }, this.CLEANUP_INTERVAL_MS)
    }

    public stopCleanupTask(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval)
            this.cleanupInterval = null
        }
    }

    private cleanupExpiredEntries(): void {
        const now = Date.now()

        // Nettoyer les entrées expirées
        for (const [key, expirationTime] of this.expirations.entries()) {
            if (expirationTime <= now) {
                this.store.delete(key)
                this.expirations.delete(key)
            }
        }

        // Nettoyer les timestamps expirés
        for (const [identifier, timestamps] of this.timestampsStore.entries()) {
            const validTimestamps = timestamps.filter(t => t.expiresAt > now)
            if (validTimestamps.length === 0) {
                this.timestampsStore.delete(identifier)
            } else if (validTimestamps.length !== timestamps.length) {
                this.timestampsStore.set(identifier, validTimestamps)
            }
        }
    }

    private checkExpired(key: string): void {
        const expiration = this.expirations.get(key)
        if (expiration && expiration < Date.now()) {
            this.store.delete(key)
            this.expirations.delete(key)
        }
    }

    async get(key: string): Promise<string | null> {
        this.checkExpired(key)
        return this.store.get(key) ?? null
    }

    async set(key: string, value: string, ttlMs?: number): Promise<void> {
        this.store.set(key, value)
        if (ttlMs && ttlMs > 0) {
            this.expirations.set(key, Date.now() + ttlMs)
        } else {
            this.expirations.delete(key)
        }
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key)
        this.expirations.delete(key)
    }

    async exists(key: string): Promise<boolean> {
        this.checkExpired(key)
        return this.store.has(key)
    }

    async increment(key: string, ttlMs?: number): Promise<number> {
        this.checkExpired(key)
        const currentValue = parseInt(this.store.get(key) ?? '0', 10)
        const newValue = currentValue + 1

        // Important: ne définir le TTL que si la clé n'existait pas
        const shouldSetTTL = ttlMs && !this.store.has(key)

        this.store.set(key, newValue.toString())

        if (shouldSetTTL) {
            this.expirations.set(key, Date.now() + ttlMs)
        }

        return newValue
    }

    // Nouvelle méthode: incrément conditionnel
    async incrementIf(
        key: string,
        maxValue: number,
        ttlMs?: number
    ): Promise<{
        value: number
        incremented: boolean
    }> {
        this.checkExpired(key)
        const currentValue = parseInt(this.store.get(key) ?? '0', 10)

        if (currentValue < maxValue) {
            const newValue = currentValue + 1
            const shouldSetTTL = ttlMs && !this.store.has(key)

            this.store.set(key, newValue.toString())

            if (shouldSetTTL) {
                this.expirations.set(key, Date.now() + ttlMs)
            }

            return { value: newValue, incremented: true }
        }

        return { value: currentValue, incremented: false }
    }

    // Nouvelle méthode: décrément
    async decrement(key: string, minValue: number = 0): Promise<number> {
        this.checkExpired(key)
        const currentValue = parseInt(this.store.get(key) ?? '0', 10)
        const newValue = Math.max(minValue, currentValue - 1)

        if (newValue === 0) {
            this.store.delete(key)
            this.expirations.delete(key)
        } else {
            this.store.set(key, newValue.toString())
        }

        return newValue
    }

    async addTimestamp(identifier: string, timestamp: number, ttlMs: number): Promise<void> {
        if (!this.timestampsStore.has(identifier)) {
            this.timestampsStore.set(identifier, [])
        }
        const timestamps = this.timestampsStore.get(identifier)!
        timestamps.push({ timestamp, expiresAt: Date.now() + ttlMs })
    }

    async countTimestamps(identifier: string, windowMs: number): Promise<number> {
        const timestamps = this.timestampsStore.get(identifier)
        if (!timestamps || timestamps.length === 0) {
            return 0
        }

        const now = Date.now()
        const windowStart = now - windowMs

        // Nettoyer et compter en une seule passe
        const validTimestamps = timestamps.filter(
            t => t.expiresAt > now && t.timestamp >= windowStart
        )

        // Mettre à jour le store si des timestamps ont été nettoyés
        if (validTimestamps.length !== timestamps.length) {
            if (validTimestamps.length === 0) {
                this.timestampsStore.delete(identifier)
            } else {
                this.timestampsStore.set(identifier, validTimestamps)
            }
        }

        return validTimestamps.length
    }

    async getOldestTimestamp(identifier: string): Promise<number | null> {
        const timestamps = this.timestampsStore.get(identifier)
        if (!timestamps || timestamps.length === 0) {
            return null
        }

        const now = Date.now()
        const validTimestamps = timestamps.filter(t => t.expiresAt > now)

        if (validTimestamps.length === 0) {
            this.timestampsStore.delete(identifier)
            return null
        }

        // Mettre à jour si nécessaire
        if (validTimestamps.length !== timestamps.length) {
            this.timestampsStore.set(identifier, validTimestamps)
        }

        return Math.min(...validTimestamps.map(t => t.timestamp))
    }

    async cleanupTimestamps(identifier: string): Promise<void> {
        const timestamps = this.timestampsStore.get(identifier)
        if (!timestamps) return

        const now = Date.now()
        const validTimestamps = timestamps.filter(t => t.expiresAt > now)

        if (validTimestamps.length === 0) {
            this.timestampsStore.delete(identifier)
        } else {
            this.timestampsStore.set(identifier, validTimestamps)
        }
    }

    async multiGet(keys: string[]): Promise<(string | null)[]> {
        return Promise.all(keys.map(key => this.get(key)))
    }

    async multiSet(entries: Array<{ key: string; value: string; ttlMs?: number }>): Promise<void> {
        for (const entry of entries) {
            await this.set(entry.key, entry.value, entry.ttlMs)
        }
    }

    pipeline(): StoragePipeline {
        return new StoragePipelineService(this)
    }

    async expire(keyOrIdentifier: string, ttlMs: number): Promise<void> {
        if (this.store.has(keyOrIdentifier) || this.timestampsStore.has(keyOrIdentifier)) {
            this.expirations.set(keyOrIdentifier, Date.now() + ttlMs)
        }
    }

    // Méthodes de debugging (à retirer en production)
    public getStore(): Map<string, string> {
        return this.store
    }

    public getExpirations(): Map<string, number> {
        return this.expirations
    }

    public getTimestampsStore(): Map<string, Array<{ timestamp: number; expiresAt: number }>> {
        return this.timestampsStore
    }
}
