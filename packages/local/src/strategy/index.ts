import type { FixedWindowStrategyOptions, createFixedWindowStrategy } from './fixed-window.strategy'
import type {
    IndividualFixedWindowStrategyOptions,
    createIndividualFixedWindowStrategy,
} from './individual-fixed-window.strategy'
import type {
    SlidingWindowStrategyOptions,
    createOptimizedSlidingWindowStrategy,
    createSlidingWindowStrategy,
} from './sliding-window.strategy'
import type {
    TokenBucketStrategyOptions,
    createContinuousTokenBucketStrategy,
    createTokenBucketStrategy,
} from './token-bucket.strategy'

// Stratégies Fixed Window
export {
    FixedWindowStrategy,
    createFixedWindowStrategy,
    type FixedWindowStrategyOptions,
} from './fixed-window.strategy'

export {
    IndividualFixedWindowStrategy,
    createIndividualFixedWindowStrategy,
    type IndividualFixedWindowStrategyOptions,
} from './individual-fixed-window.strategy'

// Stratégies Sliding Window
export {
    OptimizedSlidingWindowStrategy,
    SlidingWindowStrategy,
    createOptimizedSlidingWindowStrategy,
    createSlidingWindowStrategy,
    type SlidingWindowStrategyOptions,
} from './sliding-window.strategy'

// Stratégies Token Bucket
export {
    ContinuousTokenBucketStrategy,
    TokenBucketStrategy,
    createContinuousTokenBucketStrategy,
    createTokenBucketStrategy,
    type TokenBucketStrategyOptions,
} from './token-bucket.strategy'

// Types et helpers pour faciliter l'usage
export type {
    IndividualWindowedLimited,
    SlidingWindowLimited,
    TokenBasedLimited,
    WindowedLimited,
} from '@ratelock/core/strategy'

// Factory type générique
export type LocalStrategyFactory<T> = T extends FixedWindowStrategyOptions
    ? typeof createFixedWindowStrategy
    : T extends IndividualFixedWindowStrategyOptions
      ? typeof createIndividualFixedWindowStrategy
      : T extends SlidingWindowStrategyOptions
        ? typeof createSlidingWindowStrategy | typeof createOptimizedSlidingWindowStrategy
        : T extends TokenBucketStrategyOptions
          ? typeof createTokenBucketStrategy | typeof createContinuousTokenBucketStrategy
          : never
