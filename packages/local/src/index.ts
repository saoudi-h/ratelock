// Main exports for @ratelock/local package
export { RateLimiter } from './limiter/rate-limiter'
export { StoragePipelineService } from './storage/storage-pipline.service'
export { StorageService } from './storage/storage.service'

// Re-export core strategies for convenience
export * from './strategy'

// Re-export core types for convenience
export type { Storage, StoragePipeline } from '@ratelock/core/storage'

export type {
    BaseStrategyOptions,
    InferStrategyResult,
    Strategy,
} from '@ratelock/core/strategy'

export type { LimiterOptions } from '@ratelock/core/limiter'

// Export local factories
export * from './factory'
