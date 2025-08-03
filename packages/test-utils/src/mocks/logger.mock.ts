export interface Logger {
    debug: (...args: unknown[]) => void
    info: (...args: unknown[]) => void
    warn: (...args: unknown[]) => void
    error: (...args: unknown[]) => void
}

export const NullLogger: Logger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
}
