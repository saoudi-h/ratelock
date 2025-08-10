/**
 * Interface for logging operations with different log levels.
 */
export interface Logger {
    debug: (...args: unknown[]) => void
    info: (...args: unknown[]) => void
    warn: (...args: unknown[]) => void
    error: (...args: unknown[]) => void
}

/**
 * Implementation of the Logger interface that does nothing.
 * Useful for environments where logging is not required.
 */
export const NullLogger: Logger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
}
