import type { RateLimiter } from '../limiter/rate-limiter'
import type { BaseResult } from '../strategy/base'
import type { InferStrategyResult } from '../strategy/behaviors'
import type { Strategy } from '../strategy/strategy'
import type { CircuitBreakerConfig } from './circuit-breaker'
import { CircuitBreaker, CircuitState } from './circuit-breaker'
import type { RetryConfig } from './retry'
import { RetryService } from './retry'

/**
 * Configuration for advanced error handling
 */
export interface ErrorHandlingConfig {
    errorPolicy: 'throw' | 'allow' | 'deny'
    retryConfig?: RetryConfig
    circuitBreakerConfig?: CircuitBreakerConfig
}

export type { CircuitBreakerConfig, HealthMetrics } from './circuit-breaker'
export type { RetryConfig } from './retry'

/**
 * Enhanced result containing execution details
 */
export interface EnhancedResult<T> {
    result: T | null
    success: boolean
    attempts: number
    totalTimeMs: number
    error?: Error
    circuitState: CircuitState
}

type InferLimiterResult<S> = S extends Strategy<infer T, any> ? InferStrategyResult<T> : BaseResult

/**
 * Enhanced rate limiter with advanced error handling capabilities
 */
export class EnhancedRateLimiter<S extends Strategy<any, any>> {
    private readonly circuitBreaker?: CircuitBreaker
    private readonly retryService?: RetryService

    /**
     * Creates an instance of EnhancedRateLimiter
     * @param baseLimiter - The base rate limiter to enhance
     * @param errorConfig - Configuration for error handling
     */
    constructor(
        private readonly baseLimiter: RateLimiter<S>,
        private readonly errorConfig: ErrorHandlingConfig
    ) {
        if (errorConfig.circuitBreakerConfig) {
            this.circuitBreaker = new CircuitBreaker(errorConfig.circuitBreakerConfig)
        }
        if (errorConfig.retryConfig) {
            this.retryService = new RetryService(errorConfig.retryConfig)
        }
    }

    /**
     * Checks the rate limit with enhanced error handling
     * @param identifier - The identifier to check
     * @returns Enhanced result with execution details
     */
    async check(identifier: string): Promise<EnhancedResult<InferLimiterResult<S>>> {
        const startTime = Date.now()
        let attempts = 0
        let finalError: Error | undefined

        const operation = async (): Promise<unknown> => {
            attempts += 1
            const res = await this.baseLimiter.check(identifier)
            return res as unknown
        }

        const asLimiterResult = (v: unknown): InferLimiterResult<S> => v as InferLimiterResult<S>

        try {
            let result: InferLimiterResult<S>
            if (this.circuitBreaker) {
                result = asLimiterResult(await this.circuitBreaker.execute(operation))
            } else if (this.retryService) {
                result = asLimiterResult(await this.retryService.execute(operation))
            } else {
                result = asLimiterResult(await operation())
            }

            return {
                result,
                success: true,
                attempts,
                totalTimeMs: Date.now() - startTime,
                circuitState: this.circuitBreaker?.getMetrics().state ?? CircuitState.CLOSED,
            }
        } catch (err) {
            finalError = err as Error
            const fallbackResult = this.applyErrorPolicy(finalError) as InferLimiterResult<S> | null

            return {
                result: fallbackResult,
                success: false,
                attempts,
                totalTimeMs: Date.now() - startTime,
                error: finalError,
                circuitState: this.circuitBreaker?.getMetrics().state ?? CircuitState.CLOSED,
            }
        }
    }

    /**
     * Applies the configured error policy
     * @param error - The error to handle
     * @returns Result based on the error policy or throws the error
     */
    private applyErrorPolicy(error: Error): BaseResult | null {
        switch (this.errorConfig.errorPolicy) {
            case 'allow':
                return { allowed: true }
            case 'deny':
                return { allowed: false }
            case 'throw':
            default:
                throw error
        }
    }
}
