import type { Storage } from '../storage/storage'

/**
 * Configuration for lazy cleanup operations.
 */
export interface LazyCleanupConfig {
    maxQueueSize: number
    cleanupBatchSize: number
    cleanupIntervalMs: number
    priorityThreshold: number
}

/**
 * Handles lazy cleanup of timestamps to optimize storage operations.
 */
export class LazyTimestampCleaner {
    private readonly cleanupScheduled = new Set<string>()
    private readonly cleanupQueue: Array<{ identifier: string; priority: number }> = []
    private isProcessing = false

    constructor(
        private readonly storage: Storage,
        private readonly config: LazyCleanupConfig
    ) {}

    /**
     * Schedule a lazy cleanup for an identifier.
     * @param identifier The identifier to schedule cleanup for.
     * @param priority The priority of the cleanup task (default is 1).
     */
    scheduleCleanup(identifier: string, priority: number = 1): void {
        if (this.cleanupScheduled.has(identifier)) {
            return
        }
        this.cleanupScheduled.add(identifier)
        this.cleanupQueue.push({ identifier, priority })
        // Sort by priority (higher = more urgent)
        this.cleanupQueue.sort((a, b) => b.priority - a.priority)
        // Limit queue size
        if (this.cleanupQueue.length > this.config.maxQueueSize) {
            const removed = this.cleanupQueue.pop()
            if (removed) {
                this.cleanupScheduled.delete(removed.identifier)
            }
        }
        // Start processing if necessary
        if (priority >= this.config.priorityThreshold || !this.isProcessing) {
            void this.processQueue()
        }
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.cleanupQueue.length === 0) {
            return
        }
        this.isProcessing = true
        try {
            while (this.cleanupQueue.length > 0) {
                const batch = this.cleanupQueue.splice(0, this.config.cleanupBatchSize)
                await Promise.all(
                    batch.map(async ({ identifier }) => {
                        try {
                            await this.storage.cleanupTimestamps(identifier)
                            this.cleanupScheduled.delete(identifier)
                        } catch {
                            // If failure, lower priority and retry later
                            if (!this.cleanupScheduled.has(identifier)) {
                                this.scheduleCleanup(identifier, 0.5)
                            }
                        }
                    })
                )
                if (this.cleanupQueue.length > 0) {
                    await new Promise(resolve => setTimeout(resolve, 10))
                }
            }
        } finally {
            this.isProcessing = false
        }
        if (this.cleanupQueue.length > 0) {
            setTimeout(() => {
                void this.processQueue()
            }, this.config.cleanupIntervalMs)
        }
    }

    /**
     * Get current statistics about the cleanup process.
     * @returns An object containing queue size, scheduled count, and processing status.
     */
    getStats() {
        return {
            queueSize: this.cleanupQueue.length,
            scheduledCount: this.cleanupScheduled.size,
            isProcessing: this.isProcessing,
        }
    }
}
