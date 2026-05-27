import type { CircuitBreakerConfig, Limiter } from './types'
import { CircuitBreakerOpenError } from './errors'
type CircuitState = 'closed' | 'open' | 'half-open'

/**
 * Decorates a rate limiter with a Circuit Breaker resilience policy.
 * 
 * **State Machine Behavior:**
 * - `closed`: Requests are forwarded directly. Consecutive downstream database/network failures increment a counter.
 * - `open`: Tripped when failure threshold is exceeded. Instantly rejects requests with a `CircuitBreakerOpenError` to avoid cascading failures.
 * - `half-open`: Automatically entered after a `recoveryTimeoutMs` cooldown. A single successful probe transitions state back to `closed`, while any failure trips it back to `open`.
 * 
 * @param limiter The downstream RateLimiter engine to protect.
 * @param config Settings specifying the failure threshold and recovery timeout.
 * @returns A protected RateLimiter engine with Circuit Breaker policy.
 */
export function withCircuitBreaker<T>(
    limiter: Limiter<T>,
    config: CircuitBreakerConfig
): Limiter<T> {
    let state: CircuitState = 'closed'
    let failureCount = 0
    let lastFailureTime = 0

    const tryTransition = (): void => {
        if (state === 'open') {
            if (Date.now() - lastFailureTime >= config.recoveryTimeoutMs) {
                state = 'half-open'
            } else {
                throw new CircuitBreakerOpenError()
            }
        } else if (state === 'half-open') {
            throw new CircuitBreakerOpenError()
        }
    }

    const onSuccess = (): void => {
        failureCount = 0
        if (state === 'half-open') {
            state = 'closed'
        }
    }

    const onFailure = (): void => {
        failureCount++
        lastFailureTime = Date.now()
        if (failureCount >= config.failureThreshold) {
            state = 'open'
        }
    }

    const check = async (id: string): Promise<T> => {
        tryTransition()
        try {
            const result = await limiter.check(id)
            onSuccess()
            return result
        } catch (err) {
            onFailure()
            throw err
        }
    }

    const checkBatch = async (ids: string[]): Promise<T[]> => {
        tryTransition()
        try {
            const result = await limiter.checkBatch(ids)
            onSuccess()
            return result
        } catch (err) {
            onFailure()
            throw err
        }
    }

    return {
        check,
        checkBatch,
        async destroy() {
            await limiter.destroy?.()
        },
    }
}
