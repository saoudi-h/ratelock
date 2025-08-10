import type { BaseResult } from './base'

// Capability interfaces for composing strategy types and results

export interface Windowed {
    getWindowMs(): number
}

export interface WindowedResult {
    reset: number
}

export interface Limited {
    getLimit(): number
}

export interface LimitedResult {
    remaining: number
}

export interface TokenBased {
    getCapacity(): number
    getRefillRate(): number
    getRefillInterval(): number
}

export interface TokenBasedResult {
    tokens: number
    refillTime: number
}

export interface IndividualTracking {
    getTrackingKey(identifier: string): string
}

export interface IndividualTrackingResult {
    firstRequest: number
}

export interface SlidingWindow extends Windowed {
    getPrecision(): number
}

export interface SlidingWindowResult extends WindowedResult {
    oldestRequest: number
}

type Empty = Record<never, never>

export type InferStrategyResult<T> = BaseResult &
    (T extends Windowed ? WindowedResult : Empty) &
    (T extends Limited ? LimitedResult : Empty) &
    (T extends TokenBased ? TokenBasedResult : Empty) &
    (T extends IndividualTracking ? IndividualTrackingResult : Empty) &
    (T extends SlidingWindow ? SlidingWindowResult : Empty)

export type WindowedLimited = Windowed & Limited
export type SlidingWindowLimited = SlidingWindow & Limited
export type TokenBasedLimited = TokenBased & Limited
export type IndividualWindowedLimited = Windowed & Limited & IndividualTracking
