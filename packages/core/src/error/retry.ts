export interface RetryConfig {
    maxAttempts: number
    baseDelayMs: number
    maxDelayMs: number
    backoffMultiplier: number
    retryableErrors: Array<string | RegExp>
    jitter: boolean
}

export class RetryService {
    constructor(private readonly config: RetryConfig) {}

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        let lastError: Error | undefined
        let delay = this.config.baseDelayMs

        for (let attempt = 1; attempt <= this.config.maxAttempts; attempt += 1) {
            try {
                return await operation()
            } catch (err) {
                const error = err as Error
                lastError = error

                if (!this.isRetryableError(error)) {
                    throw error
                }
                if (attempt === this.config.maxAttempts) {
                    break
                }

                await this.sleep(this.calculateDelay(delay))
                delay = Math.min(delay * this.config.backoffMultiplier, this.config.maxDelayMs)
            }
        }

        // lastError ne peut pas être undefined ici
        throw lastError as Error
    }

    private isRetryableError(error: Error): boolean {
        return this.config.retryableErrors.some(pattern => {
            if (typeof pattern === 'string') {
                return error.message.includes(pattern)
            }
            return pattern.test(error.message)
        })
    }

    private calculateDelay(baseDelay: number): number {
        if (!this.config.jitter) return Math.max(0, baseDelay)
        const jitterRange = baseDelay * 0.25
        const jitter = (Math.random() - 0.5) * 2 * jitterRange
        return Math.max(0, baseDelay + jitter)
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}
