export class RatelockError extends Error {
    constructor(message: string) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

export class CircuitBreakerOpenError extends RatelockError {
    constructor() {
        super('Circuit breaker is OPEN. Request denied.')
    }
}
