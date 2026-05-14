import type { Limiter, RetryConfig } from './types'

export function withRetry<T>(limiter: Limiter<T>, config: RetryConfig): Limiter<T> {
    const baseDelayMs = config.baseDelayMs ?? 100
    const maxDelayMs = config.maxDelayMs ?? 2000

    const retry = async (id: string): Promise<T> => {
        let lastError: unknown
        for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
            try {
                return await limiter.check(id)
            } catch (err) {
                lastError = err
                if (attempt === config.maxAttempts - 1) break
                const delay = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs)
                await new Promise(r => setTimeout(r, delay))
            }
        }
        throw lastError
    }

    return {
        check: retry,
        checkBatch(ids: string[]): Promise<T[]> {
            return limiter.checkBatch(ids)
        },
    }
}
