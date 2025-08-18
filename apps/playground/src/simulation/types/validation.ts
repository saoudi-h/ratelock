import { z } from 'zod'
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

export const tokenBucketConfigSchema = z.object({
    capacity: z.number().min(1).max(50),
    refillRate: z.number().min(1).max(50),
    refillTime: z.number().min(1000),
})

export const slidingWindowConfigSchema = z.object({
    limit: z.number().min(1).max(50),
    windowMs: z.number().min(1000),
})

export const individualFixedWindowConfigSchema = z.object({
    limit: z.number().min(1).max(50),
    windowMs: z.number().min(1000),
})

export const fixedWindowConfigSchema = z.object({
    limit: z.number().min(1).max(50),
    windowMs: z.number().min(1000),
})

export const localStorageConfigSchema = z.object({
    cleanupIntervalMs: z.number().positive().optional(),
    cleanupRequestThreshold: z.number().positive().optional(),
})

export const redisStorageConfigSchema = z.object({
    url: z.string().url().optional(),
    host: z.string().optional(),
    port: z.number().int().min(1).max(65535).optional(),
    password: z.string().optional(),
    db: z.number().int().nonnegative().optional(),
    keyPrefix: z.string().optional(),
})

export const storageConfigSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('local'),
        config: localStorageConfigSchema,
    }),
    z.object({
        type: z.literal('redis'),
        config: redisStorageConfigSchema,
    }),
])

export const strategyConfigSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('fixed-window'),
        config: fixedWindowConfigSchema,
    }),
    z.object({
        type: z.literal('sliding-window'),
        config: slidingWindowConfigSchema,
    }),
    z.object({
        type: z.literal('token-bucket'),
        config: tokenBucketConfigSchema,
    }),
    z.object({
        type: z.literal('individual-fixed-window'),
        config: individualFixedWindowConfigSchema,
    }),
])

/**
 * Standard validation response format
 */
export interface ValidationResult {
    isValid: boolean
    errors: string[]
}

/**
 * Converts Zod validation errors to standardized validation result format
 * @param error Zod validation error
 * @returns Formatted validation result with error paths and messages
 */
function zodToValidationResult(error: z.ZodError): ValidationResult {
    return {
        isValid: false,
        errors: error.issues.map(err => err.message),
    }
}

/**
 * Validates fixed window strategy configuration
 * @param config Configuration to validate
 * @returns Validation result with error messages if invalid
 */
export function validateFixedWindowConfig(config: FixedWindowConfig): ValidationResult {
    const result = fixedWindowConfigSchema.safeParse(config)
    if (result.success) {
        return { isValid: true, errors: [] }
    }
    return zodToValidationResult(result.error)
}

/**
 * Validates sliding window strategy configuration
 * @param config Configuration to validate
 * @returns Validation result with error messages if invalid
 */
export function validateSlidingWindowConfig(config: SlidingWindowConfig): ValidationResult {
    const result = slidingWindowConfigSchema.safeParse(config)
    if (result.success) {
        return { isValid: true, errors: [] }
    }
    return zodToValidationResult(result.error)
}

/**
 * Validates token bucket strategy configuration
 * @param config Configuration to validate
 * @returns Validation result with error messages if invalid
 */
export function validateTokenBucketConfig(config: TokenBucketConfig): ValidationResult {
    const result = tokenBucketConfigSchema.safeParse(config)
    if (result.success) {
        return { isValid: true, errors: [] }
    }
    return zodToValidationResult(result.error)
}

/**
 * Validates individual fixed window strategy configuration
 * @param config Configuration to validate
 * @returns Validation result with error messages if invalid
 */
export function validateIndividualFixedWindowConfig(
    config: IndividualFixedWindowConfig
): ValidationResult {
    const result = individualFixedWindowConfigSchema.safeParse(config)
    if (result.success) {
        return { isValid: true, errors: [] }
    }
    return zodToValidationResult(result.error)
}

/**
 * Validates local storage configuration
 * @param config Configuration to validate
 * @returns Validation result with error messages if invalid
 */
export function validateLocalStorageConfig(config: LocalStorageConfig): ValidationResult {
    const result = localStorageConfigSchema.safeParse(config)
    if (result.success) {
        return { isValid: true, errors: [] }
    }
    return zodToValidationResult(result.error)
}

/**
 * Validates Redis storage configuration
 * @param config Configuration to validate
 * @returns Validation result with error messages if invalid
 */
export function validateRedisStorageConfig(config: RedisStorageConfig): ValidationResult {
    const result = redisStorageConfigSchema.safeParse(config)
    if (result.success) {
        return { isValid: true, errors: [] }
    }
    return zodToValidationResult(result.error)
}

/**
 * Validates complete strategy configuration
 * @param strategy Configuration to validate
 * @returns Validation result with error messages if invalid
 */
export function validateStrategyConfig(strategy: StrategyConfig): ValidationResult {
    const result = strategyConfigSchema.safeParse(strategy)
    if (result.success) {
        return { isValid: true, errors: [] }
    }
    return zodToValidationResult(result.error)
}

/**
 * Validates complete storage configuration
 * @param storage Configuration to validate
 * @returns Validation result with error messages if invalid
 */
export function validateStorageConfig(storage: StorageConfig): ValidationResult {
    const result = storageConfigSchema.safeParse(storage)
    if (result.success) {
        return { isValid: true, errors: [] }
    }
    return zodToValidationResult(result.error)
}

/**
 * Enhances storage configuration with default values
 * @param config Base configuration
 * @returns Enhanced configuration with resolved defaults
 * @note For Redis config, automatically resolves URL from environment if not provided
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
                },
            }
    }
}

/**
 * Resolves Redis connection URL from environment variables
 * @returns Valid Redis connection URL
 * @throws Error when no valid Redis URL is available in environment
 */
export function resolveRedisUrl(): string {
    const redisRegex = /^rediss?:\/\/(?:[^:@]*(?::[^@]*)?@)?[^/@:]+(?::\d+)?(?:\/\d+)?$/
    const envUrl = process.env.REDIS_URL?.trim()
    if (envUrl && typeof envUrl === 'string' && redisRegex.test(envUrl)) {
        return envUrl
    }
    throw new Error('Invalid Redis URL')
}
