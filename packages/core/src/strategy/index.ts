export { Strategy } from './abstract'
export type { BaseResult } from './base'
export { StrategyBuilder, createStrategy } from './builder'
export type {
    IndividualTracking,
    IndividualTrackingResult,
    IndividualWindowedLimited,
    InferStrategyResult,
    Limited,
    LimitedResult,
    SlidingWindow,
    SlidingWindowLimited,
    SlidingWindowResult,
    TokenBased,
    TokenBasedLimited,
    TokenBasedResult,
    Windowed,
    WindowedLimited,
    WindowedResult,
} from './capabilities'
export { createStrategyFactory } from './factory'
export {
    FixedWindow,
    FixedWindowStrategy,
    createFixedWindowStrategy,
    createTypedFixedWindowStrategy,
    fixedWindowValidator,
} from './fixed-window'
export type { FixedWindowOptions } from './fixed-window'

export {
    IndividualFixedWindow,
    IndividualFixedWindowStrategy,
    createIndividualFixedWindowStrategy,
    createTypedIndividualFixedWindowStrategy,
    individualFixedWindowValidator,
} from './individual-fixed-window'
export type { IndividualFixedWindowOptions } from './individual-fixed-window'

export {
    SlidingWindowBuilder,
    SlidingWindowStrategy,
    createSlidingWindowStrategy,
    createTypedSlidingWindowStrategy,
    slidingWindowValidator,
} from './sliding-window'
export type { SlidingWindowOptions } from './sliding-window'

export { StrategyRegistry } from './registry'
export {
    TokenBucket,
    TokenBucketStrategy,
    createTokenBucketStrategy,
    createTypedTokenBucketStrategy,
    tokenBucketValidator,
} from './token-bucket'
export type { TokenBucketOptions } from './token-bucket'
export type {
    BaseStrategyOptions,
    StrategyContext,
    StrategyMetadata,
    StrategyStats,
    TypedStrategyFactory,
} from './types'
