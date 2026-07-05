export class RatelockError extends Error {
    constructor(message: string, options?: { cause?: unknown }) {
        super(message, options)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

export class CircuitBreakerOpenError extends RatelockError {
    constructor(options?: { cause?: unknown }) {
        super('Circuit breaker is OPEN. Request denied.', options)
    }
}
