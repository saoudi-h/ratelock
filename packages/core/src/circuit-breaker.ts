import type { CircuitBreakerConfig, Limiter } from './types'

type CircuitState = 'closed' | 'open' | 'half-open'

export function withCircuitBreaker<T>(
    limiter: Limiter<T>,
    config: CircuitBreakerConfig
): Limiter<T> {
    let state: CircuitState = 'closed'
    let failureCount = 0
    let lastFailureTime = 0

    const check = async (id: string): Promise<T> => {
        if (state === 'open') {
            if (Date.now() - lastFailureTime >= config.recoveryTimeoutMs) {
                state = 'half-open'
            } else {
                throw new Error('Circuit breaker is open')
            }
        }

        try {
            const result = await limiter.check(id)
            if (state === 'half-open') {
                state = 'closed'
                failureCount = 0
            }
            return result
        } catch (err) {
            failureCount++
            lastFailureTime = Date.now()
            if (failureCount >= config.failureThreshold) {
                state = 'open'
            }
            throw err
        }
    }

    const checkBatch = async (ids: string[]): Promise<T[]> => {
        if (state === 'open') {
            if (Date.now() - lastFailureTime >= config.recoveryTimeoutMs) {
                state = 'half-open'
            } else {
                throw new Error('Circuit breaker is open')
            }
        }

        try {
            const result = await limiter.checkBatch(ids)
            if (state === 'half-open') {
                state = 'closed'
                failureCount = 0
            }
            return result
        } catch (err) {
            failureCount++
            lastFailureTime = Date.now()
            if (failureCount >= config.failureThreshold) {
                state = 'open'
            }
            throw err
        }
    }

    return {
        check,
        checkBatch,
    }
}
