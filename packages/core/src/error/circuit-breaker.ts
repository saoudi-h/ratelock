/**
 * Represents the state of a circuit breaker.
 */
export enum CircuitState {
    CLOSED = 'closed',
    OPEN = 'open',
    HALF_OPEN = 'half-open',
}

/**
 * Configuration for a circuit breaker.
 */
export interface CircuitBreakerConfig {
    failureThreshold: number
    recoveryTimeoutMs: number
    monitoringWindowMs: number
    minimumRequestsForStats: number
}

/**
 * Health metrics for a circuit breaker.
 */
export interface HealthMetrics {
    state: CircuitState
    successCount: number
    failureCount: number
    lastFailureTime: number | null
    consecutiveFailures: number
    uptime: number
    responseTimeAvg: number
    isHealthy: boolean
}

/**
 * Implements the circuit breaker pattern to improve system resilience.
 */
export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED
    private failureCount = 0
    private successCount = 0
    private nextAttemptTime = 0
    private lastFailureTime: number | null = null
    // Simple moving average
    private responseTimeAvg = 0
    private totalRequests = 0
    private readonly startTime = Date.now()

    /**
     * Creates an instance of CircuitBreaker.
     * @param config Configuration for the circuit breaker.
     */
    constructor(private readonly config: CircuitBreakerConfig) {}

    /**
     * Executes an operation with circuit breaker protection.
     * @param operation The operation to execute.
     * @returns A promise that resolves to the result of the operation.
     * @throws An error if the circuit breaker is open or the operation fails.
     */
    async execute<T>(operation: () => Promise<T>): Promise<T> {
        const now = Date.now()
        if (this.state === CircuitState.OPEN) {
            if (now < this.nextAttemptTime) {
                throw new Error('Circuit breaker is OPEN')
            }
            // Test in half-open state
            this.state = CircuitState.HALF_OPEN
        }
        const start = now
        try {
            const result = await operation()
            this.onSuccess(Date.now() - start)
            return result
        } catch (err) {
            this.onFailure(Date.now() - start)
            throw err
        }
    }

    private onSuccess(responseTime: number): void {
        this.successCount += 1
        this.failureCount = 0
        this.totalRequests += 1
        this.responseTimeAvg =
            (this.responseTimeAvg * (this.totalRequests - 1) + responseTime) / this.totalRequests
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.CLOSED
        }
    }

    private onFailure(responseTime: number): void {
        this.failureCount += 1
        this.lastFailureTime = Date.now()
        this.totalRequests += 1
        this.responseTimeAvg =
            (this.responseTimeAvg * (this.totalRequests - 1) + responseTime) / this.totalRequests
        if (this.failureCount >= this.config.failureThreshold) {
            this.state = CircuitState.OPEN
            this.nextAttemptTime = Date.now() + this.config.recoveryTimeoutMs
        }
    }

    /**
     * Gets the current health metrics of the circuit breaker.
     * @returns An object containing the health metrics.
     */
    getMetrics(): HealthMetrics {
        return {
            state: this.state,
            successCount: this.successCount,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime,
            consecutiveFailures: this.failureCount,
            uptime: Date.now() - this.startTime,
            responseTimeAvg: this.responseTimeAvg,
            isHealthy: this.state !== CircuitState.OPEN,
        }
    }
}
