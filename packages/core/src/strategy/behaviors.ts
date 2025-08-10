import type { BaseResult } from './base'

/**
 * Interface for windowed rate limiting strategies.
 */
export interface Windowed {
    getWindowMs(): number
}

/**
 * Result interface for windowed rate limiting strategies.
 */
export interface WindowedResult {
    reset: number
}

/**
 * Interface for limited rate limiting strategies.
 */
export interface Limited {
    getLimit(): number
}

/**
 * Result interface for limited rate limiting strategies.
 */
export interface LimitedResult {
    remaining: number
}

/**
 * Interface for token-based rate limiting strategies.
 */
export interface TokenBased {
    getCapacity(): number
    getRefillRate(): number
    getRefillInterval(): number
}

/**
 * Result interface for token-based rate limiting strategies.
 */
export interface TokenBasedResult {
    tokens: number
    refillTime: number
}

/**
 * Interface for rate limiting strategies that track individual identifiers.
 */
export interface IndividualTracking {
    getTrackingKey(identifier: string): string
}

/**
 * Result interface for rate limiting strategies that track individual identifiers.
 */
export interface IndividualTrackingResult {
    firstRequest: number
}

/**
 * Interface for sliding window rate limiting strategies.
 */
export interface SlidingWindow extends Windowed {
    getPrecision(): number
}

/**
 * Result interface for sliding window rate limiting strategies.
 */
export interface SlidingWindowResult extends WindowedResult {
    oldestRequest: number
}

/**
 * Internal utility to generate a strict empty type instead of {}.
 */
type Empty = Record<never, never>

/**
 * Infers the result type based on the provided strategy type.
 */
export type InferStrategyResult<T> = BaseResult &
    (T extends Windowed ? WindowedResult : Empty) &
    (T extends Limited ? LimitedResult : Empty) &
    (T extends TokenBased ? TokenBasedResult : Empty) &
    (T extends IndividualTracking ? IndividualTrackingResult : Empty) &
    (T extends SlidingWindow ? SlidingWindowResult : Empty)

/**
 * Combined interface for windowed and limited rate limiting strategies.
 */
export type WindowedLimited = Windowed & Limited

/**
 * Combined interface for sliding window and limited rate limiting strategies.
 */
export type SlidingWindowLimited = SlidingWindow & Limited

/**
 * Combined interface for token-based and limited rate limiting strategies.
 */
export type TokenBasedLimited = TokenBased & Limited

/**
 * Combined interface for individual tracking, windowed, and limited rate limiting strategies.
 */
export type IndividualWindowedLimited = Windowed & Limited & IndividualTracking
