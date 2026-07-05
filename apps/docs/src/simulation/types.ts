import type { FixedWindowResult, SlidingWindowResult, TokenBucketResult } from '@ratelock/local'

export type StrategyId =
    | 'fixed-window'
    | 'sliding-window'
    | 'token-bucket'
    | 'individual-fixed-window'

export type SimulationResult = FixedWindowResult | SlidingWindowResult | TokenBucketResult

export interface RequestEvent {
    id: string
    timestamp: number
    userId: string
    allowed: boolean
    remaining: number
    result: SimulationResult
    strategyId: StrategyId
}

export interface FixedWindowConfig {
    limit: number
    windowMs: number
}

export interface SlidingWindowConfig {
    limit: number
    windowMs: number
}

export interface TokenBucketConfig {
    capacity: number
    refillRate: number
}

export interface IndividualFixedWindowConfig {
    limit: number
    windowMs: number
}

export type StrategySpecificConfig =
    | FixedWindowConfig
    | SlidingWindowConfig
    | TokenBucketConfig
    | IndividualFixedWindowConfig

export type StrategyConfig = Record<StrategyId, StrategySpecificConfig>

export const DEFAULT_CONFIGS: StrategyConfig = {
    'fixed-window': {
        limit: 4,
        windowMs: 6_000,
    },
    'sliding-window': {
        limit: 4,
        windowMs: 6_000,
    },
    'token-bucket': {
        capacity: 4,
        refillRate: 1,
    },
    'individual-fixed-window': {
        limit: 4,
        windowMs: 6_000,
    },
}

export const STRATEGY_LABELS: Record<StrategyId, string> = {
    'fixed-window': 'Fixed Window',
    'sliding-window': 'Sliding Window',
    'token-bucket': 'Token Bucket',
    'individual-fixed-window': 'Individual Fixed Window',
}

export const STRATEGY_DESCRIPTIONS: Record<StrategyId, string> = {
    'fixed-window': 'Requests counted in fixed time intervals. Simple and efficient.',
    'sliding-window': 'Rolling window for smooth rate limiting without boundary issues.',
    'token-bucket': 'Allows bursts while maintaining average rate over time.',
    'individual-fixed-window': 'Fixed window behavior scoped to one identifier at a time.',
}

export function isTokenBucketConfig(config: StrategySpecificConfig): config is TokenBucketConfig {
    return 'capacity' in config && 'refillRate' in config
}

export function isWindowConfig(config: StrategySpecificConfig): config is FixedWindowConfig {
    return 'limit' in config && 'windowMs' in config
}
