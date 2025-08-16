import type {
    FixedWindowConfig,
    IndividualFixedWindowConfig,
    LocalStorageConfig,
    RedisStorageConfig,
    SlidingWindowConfig,
    StorageConfig,
    StrategyConfig,
    TokenBucketConfig,
} from './types'

/**
 * Standard validation response format
 */
export interface ValidationResult {
    isValid: boolean
    errors: string[]
}

/**
 * Validates fixed window strategy configuration
 * @param config Configuration to validate
 * @returns Validation result with error messages
 */
export function validateFixedWindowConfig(config: FixedWindowConfig): ValidationResult {
    const errors: string[] = []

    if (!Number.isInteger(config.limit) || config.limit <= 0) {
        errors.push('Limit must be a positive integer')
    }
    if (!Number.isInteger(config.windowMs) || config.windowMs <= 0) {
        errors.push('Window duration must be a positive integer (milliseconds)')
    }
    if (config.windowMs < 1000) {
        errors.push('Window duration should be at least 1 second (1000ms)')
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

/**
 * Validates sliding window strategy configuration
 * @param config Configuration to validate
 * @returns Validation result with error messages
 */
export function validateSlidingWindowConfig(config: SlidingWindowConfig): ValidationResult {
    const errors: string[] = []

    if (!Number.isInteger(config.limit) || config.limit <= 0) {
        errors.push('Limit must be a positive integer')
    }
    if (!Number.isInteger(config.windowMs) || config.windowMs <= 0) {
        errors.push('Window duration must be a positive integer (milliseconds)')
    }
    if (config.windowMs < 1000) {
        errors.push('Window duration should be at least 1 second (1000ms)')
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

/**
 * Validates token bucket strategy configuration
 * @param config Configuration to validate
 * @returns Validation result with error messages
 */
export function validateTokenBucketConfig(config: TokenBucketConfig): ValidationResult {
    const errors: string[] = []

    if (!Number.isInteger(config.capacity) || config.capacity <= 0) {
        errors.push('Capacity must be a positive integer')
    }
    if (!Number.isInteger(config.refillRate) || config.refillRate <= 0) {
        errors.push('Refill rate must be a positive integer')
    }
    if (!Number.isInteger(config.refillTime) || config.refillTime <= 0) {
        errors.push('Refill time must be a positive integer (milliseconds)')
    }
    if (config.refillTime < 100) {
        errors.push('Refill time should be at least 100ms')
    }
    if (config.refillRate > config.capacity) {
        errors.push('Refill rate should not exceed capacity')
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

/**
 * Validates individual fixed window strategy configuration
 * @param config Configuration to validate
 * @returns Validation result with error messages
 */
export function validateIndividualFixedWindowConfig(
    config: IndividualFixedWindowConfig
): ValidationResult {
    const errors: string[] = []

    if (!Number.isInteger(config.limit) || config.limit <= 0) {
        errors.push('Limit must be a positive integer')
    }
    if (!Number.isInteger(config.windowMs) || config.windowMs <= 0) {
        errors.push('Window duration must be a positive integer (milliseconds)')
    }
    if (config.windowMs < 1000) {
        errors.push('Window duration should be at least 1 second (1000ms)')
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

/**
 * Validates local storage configuration
 * @param config Configuration to validate
 * @returns Validation result with error messages
 */
export function validateLocalStorageConfig(config: LocalStorageConfig): ValidationResult {
    const errors: string[] = []

    if (config.cleanupIntervalMs !== undefined) {
        if (!Number.isInteger(config.cleanupIntervalMs) || config.cleanupIntervalMs <= 0) {
            errors.push('Cleanup interval must be a positive integer (milliseconds)')
        }
    }
    if (config.cleanupRequestThreshold !== undefined) {
        if (
            !Number.isInteger(config.cleanupRequestThreshold) ||
            config.cleanupRequestThreshold <= 0
        ) {
            errors.push('Cleanup request threshold must be a positive integer')
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

/**
 * Validates Redis storage configuration
 * @param config Configuration to validate
 * @returns Validation result with error messages
 */
export function validateRedisStorageConfig(config: RedisStorageConfig): ValidationResult {
    const errors: string[] = []

    if (config.url && typeof config.url !== 'string') {
        errors.push('Redis URL must be a string')
    }
    if (config.host && typeof config.host !== 'string') {
        errors.push('Redis host must be a string')
    }
    if (config.port !== undefined) {
        if (!Number.isInteger(config.port) || config.port <= 0 || config.port > 65535) {
            errors.push('Redis port must be a valid port number (1-65535)')
        }
    }
    if (config.password && typeof config.password !== 'string') {
        errors.push('Redis password must be a string')
    }
    if (config.db !== undefined) {
        if (!Number.isInteger(config.db) || config.db < 0) {
            errors.push('Redis database number must be a non-negative integer')
        }
    }
    if (config.keyPrefix && typeof config.keyPrefix !== 'string') {
        errors.push('Redis key prefix must be a string')
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

/**
 * Enhances storage configuration with defaults
 * @param config Base configuration
 * @returns Enhanced configuration with resolved defaults
 */
export function enrichStorageConfig(config: StorageConfig): StorageConfig {
    switch (config.type) {
        case 'local':
            return config
        case 'redis':
            return {
                ...config,
                config: {
                    ...config.config,
                    url: config.config.url ?? resolveRedisUrl(),
                }
            }
    }
}

/**
 * Validates complete strategy configuration
 * @param strategy Configuration to validate
 * @returns Validation result with error messages
 */
export function validateStrategyConfig(strategy: StrategyConfig): ValidationResult {
    switch (strategy.type) {
        case 'fixed-window':
            return validateFixedWindowConfig(strategy.config)
        case 'sliding-window':
            return validateSlidingWindowConfig(strategy.config)
        case 'token-bucket':
            return validateTokenBucketConfig(strategy.config)
        case 'individual-fixed-window':
            return validateIndividualFixedWindowConfig(strategy.config)
        default:
            return {
                isValid: false,
                errors: ['Unknown strategy type'],
            }
    }
}

/**
 * Resolves Redis connection URL from environment
 * @returns Valid Redis connection URL
 * @throws When no valid Redis URL is available
 */
export function resolveRedisUrl(): string {
    const redisRegex = /^rediss?:\/\/(?:([^:@]*)(?::([^@]*))?@)?([^\/@:]+)(?::(\d+))?(\/\d+)?$/
    const envUrl = process.env.REDIS_URL?.trim()

    if (envUrl && typeof envUrl === 'string' && redisRegex.test(envUrl)) {
        return envUrl
    }

    throw new Error('Invalid Redis URL')
}

/**
 * Validates complete storage configuration
 * @param storage Configuration to validate
 * @returns Validation result with error messages
 */
export function validateStorageConfig(storage: StorageConfig): ValidationResult {
    switch (storage.type) {
        case 'local':
            return validateLocalStorageConfig(storage.config)
        case 'redis':
            return validateRedisStorageConfig(storage.config)
        default:
            return {
                isValid: false,
                errors: ['Unknown storage type'],
            }
    }
}
