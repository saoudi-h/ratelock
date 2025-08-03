
export enum CircuitState {
    CLOSED = 'closed',
    OPEN = 'open',
    HALF_OPEN = 'half-open',
}

export interface CircuitBreakerConfig {
    failureThreshold: number
    recoveryTimeoutMs: number
    monitoringWindowMs: number 
    minimumRequestsForStats: number 
}

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

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED
    private failureCount = 0
    private successCount = 0
    private nextAttemptTime = 0
    private lastFailureTime: number | null = null

    // moyenne mobile simple
    private responseTimeAvg = 0
    private totalRequests = 0
    private readonly startTime = Date.now()

    constructor(private readonly config: CircuitBreakerConfig) {}

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        const now = Date.now()

        if (this.state === CircuitState.OPEN) {
            if (now < this.nextAttemptTime) {
                throw new Error('Circuit breaker is OPEN')
            }
            // tester en half-open
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
