/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { BaseResult } from './base'

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

export type InferStrategyResult<T> = BaseResult &
    (T extends Windowed ? WindowedResult : {}) &
    (T extends Limited ? LimitedResult : {}) &
    (T extends TokenBased ? TokenBasedResult : {}) &
    (T extends IndividualTracking ? IndividualTrackingResult : {}) &
    (T extends SlidingWindow ? SlidingWindowResult : {})

export type WindowedLimited = Windowed & Limited
export type SlidingWindowLimited = SlidingWindow & Limited
export type TokenBasedLimited = TokenBased & Limited
export type IndividualWindowedLimited = Windowed & Limited & IndividualTracking
