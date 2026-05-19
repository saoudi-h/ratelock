import type { CircuitBreakerConfig, Limiter } from './types'

type CircuitState = 'closed' | 'open' | 'half-open'

export function withCircuitBreaker<T>(
    limiter: Limiter<T>,
    config: CircuitBreakerConfig
): Limiter<T> {
    let state: CircuitState = 'closed'
    let failureCount = 0
    let lastFailureTime = 0
    let lastError: unknown = undefined
    let isProbing = false

    const tryTransition = (): void => {
        if (state === 'open') {
            if (Date.now() - lastFailureTime >= config.recoveryTimeoutMs && !isProbing) {
                state = 'half-open'
                isProbing = true
            } else {
                throw new Error('Circuit breaker is open', { cause: lastError })
            }
        }
    }

    const onSuccess = (): void => {
        if (state === 'half-open') {
            state = 'closed'
            failureCount = 0
            isProbing = false
        }
    }

    const onFailure = (err: unknown): void => {
        failureCount++
        lastFailureTime = Date.now()
        lastError = err
        isProbing = false
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
            onFailure(err)
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
            onFailure(err)
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
