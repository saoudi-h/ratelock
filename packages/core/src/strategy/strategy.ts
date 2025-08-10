export * from './abstract'
export * from './builder'
export * from './factory'
export * from './registry'
export * from './types'
// Note: concrete strategies live in their own subdirectories

/**
 * Generic factory creator that wires validation and normalization into the construction step.
 * It returns a factory function producing Strategy instances with validated/normalized options.
 */
// Deprecated: createStrategyFactory is now exported from './factory'

// Concrete strategies are exported from their own directories
