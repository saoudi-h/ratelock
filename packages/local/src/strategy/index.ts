// Re-export core strategies for convenience
export {
    FixedWindowStrategy,
    createFixedWindowStrategy,
    type FixedWindowOptions,
} from '@ratelock/core/strategy'

export {
    IndividualFixedWindowStrategy,
    createIndividualFixedWindowStrategy,
    type IndividualFixedWindowOptions,
} from '@ratelock/core/strategy'

export {
    SlidingWindowStrategy,
    createSlidingWindowStrategy,
    type SlidingWindowOptions,
} from '@ratelock/core/strategy'

export {
    TokenBucketStrategy,
    createTokenBucketStrategy,
    type TokenBucketOptions,
} from '@ratelock/core/strategy'

// Re-export core strategy types
export type {
    BaseStrategyOptions,
    InferStrategyResult,
    SlidingWindowLimited,
    Strategy,
    TokenBasedLimited,
    WindowedLimited,
} from '@ratelock/core/strategy'
