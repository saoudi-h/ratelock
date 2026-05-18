/**
 * Validate fixed-window and individual-fixed-window limiter options.
 * @throws {RangeError} if `limit` or `windowMs` are not positive finite numbers.
 */
export function validateFixedWindowOptions(opts: { limit: number; windowMs: number }): void {
    if (!Number.isFinite(opts.limit) || opts.limit < 1) {
        throw new RangeError(`limit must be a positive integer, got ${opts.limit}`)
    }
    if (!Number.isFinite(opts.windowMs) || opts.windowMs < 1) {
        throw new RangeError(`windowMs must be a positive number, got ${opts.windowMs}`)
    }
}

/**
 * Validate sliding-window limiter options.
 * @throws {RangeError} if `limit` or `windowMs` are not positive finite numbers.
 */
export function validateSlidingWindowOptions(opts: { limit: number; windowMs: number }): void {
    validateFixedWindowOptions(opts)
}

/**
 * Validate token-bucket limiter options.
 * @throws {RangeError} if `capacity` or `refillRate` are not positive finite numbers.
 */
export function validateTokenBucketOptions(opts: { capacity: number; refillRate: number }): void {
    if (!Number.isFinite(opts.capacity) || opts.capacity < 1) {
        throw new RangeError(`capacity must be a positive integer, got ${opts.capacity}`)
    }
    if (!Number.isFinite(opts.refillRate) || opts.refillRate <= 0) {
        throw new RangeError(`refillRate must be a positive number, got ${opts.refillRate}`)
    }
}
