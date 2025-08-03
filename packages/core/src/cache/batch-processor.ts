export interface BatchConfig {
    maxBatchSize: number
    batchTimeoutMs: number
    autoFlush: boolean
}

interface PendingOperation<T> {
    identifier: string
    resolve: (value: T) => void
    reject: (error: Error) => void
    timestamp: number
}

export class BatchProcessor<T> {
    private pendingOperations: Array<PendingOperation<T>> = []
    private flushTimer: NodeJS.Timeout | undefined

    constructor(
        private readonly config: BatchConfig,
        private readonly processor: (identifiers: string[]) => Promise<T[]>
    ) {}

    add(identifier: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const op: PendingOperation<T> = {
                identifier,
                resolve,
                reject,
                timestamp: Date.now(),
            }

            this.pendingOperations.push(op)

            if (
                this.config.autoFlush &&
                this.pendingOperations.length >= this.config.maxBatchSize
            ) {
                void this.flush()
            } else {
                this.scheduleFlush()
            }
        })
    }

    private scheduleFlush(): void {
        if (this.flushTimer) return
        this.flushTimer = setTimeout(() => {
            void this.flush()
        }, this.config.batchTimeoutMs)
    }

    private async flush(): Promise<void> {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer)
            this.flushTimer = undefined
        }
        if (this.pendingOperations.length === 0) return

        const ops = this.pendingOperations.splice(0)
        const identifiers = ops.map(o => o.identifier)

        try {
            const results = await this.processor(identifiers)
            ops.forEach((op, i) => {

                op.resolve(results[i]!)
            })
        } catch (e) {
            const err = e as Error
            ops.forEach(op => op.reject(err))
        }
    }

    stop(): void {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer)
            this.flushTimer = undefined
        }
    }
}
