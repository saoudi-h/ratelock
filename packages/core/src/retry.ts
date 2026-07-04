import type { Limiter, RetryConfig } from './types'

/**
 * Decorates a rate limiter with a Retry resilience policy.
 * 
 * **Resilience Behavior:**
 * Intercepts query exceptions (like transient network failures, connection pool saturation, or locking conflicts)
 * and automatically retries the check using **Exponential Backoff** with **Randomized Jitter** to prevent thundering herd problems.
 * 
 * @param limiter The downstream RateLimiter engine to retry.
 * @param config Retry configurations including maximum attempts, base delay, and maximum delay bounds.
 * @returns A self-healing RateLimiter engine with auto-retry logic.
 */
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
                const exp = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs)
                const delay = Math.random() * exp
                await new Promise(r => setTimeout(r, delay))
            }
        }
        throw lastError
    }

    const retryBatch = async (ids: string[]): Promise<T[]> => {
        let lastError: unknown
        for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
            try {
                return await limiter.checkBatch(ids)
            } catch (err) {
                lastError = err
                if (attempt === config.maxAttempts - 1) break
                const exp = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs)
                const delay = Math.random() * exp
                await new Promise(r => setTimeout(r, delay))
            }
        }
        throw lastError
    }

    return {
        check: retry,
        checkBatch: retryBatch,
        async destroy() {
            await limiter.destroy?.()
        },
    }
}
