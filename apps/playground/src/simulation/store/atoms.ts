'use client'
import type {
    FixedWindowConfig,
    IndividualFixedWindowConfig,
    RateLimitStrategy,
    RequestEvent,
    SlidingWindowConfig,
    StrategyConfig,
    TokenBucketConfig,
} from '@/simulation/types'
import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'

/**
 * Strategy state atoms using atomFamily for isolation
 * Each strategy type maintains completely separate state
 */
export const isRunningAtomFamily = atomFamily(() => atom(false))
export const eventsAtomFamily = atomFamily(() => atom<RequestEvent[]>([]))
export const autoRequestsAtomFamily = atomFamily(() => atom(false))
export const autoRequestIntervalAtomFamily = atomFamily(() => atom(1500))
export const simulationStartTimeAtomFamily = atomFamily(() => atom<number | null>(null))
export const hasInitialStartedAtomFamily = atomFamily(() => atom(false))

/**
 * Default strategy configurations
 */
export const fixedWindowConfigAtom = atom<FixedWindowConfig>({
    limit: 5,
    windowMs: 10_000,
})

export const slidingWindowConfigAtom = atom<SlidingWindowConfig>({
    limit: 5,
    windowMs: 10_000,
})

export const tokenBucketConfigAtom = atom<TokenBucketConfig>({
    capacity: 10,
    refillRate: 1,
    refillTime: 1000,
})

export const individualFixedWindowConfigAtom = atom<IndividualFixedWindowConfig>({
    limit: 5,
    windowMs: 10_000,
})

/**
 * Token bucket specific state atoms
 */
export const currentTokensAtomFamily = atomFamily(() => atom(10))
export const lastRefillTimeAtomFamily = atomFamily(() => atom(0))

/**
 * Gets configuration for a specific strategy type
 * @param strategyId The strategy identifier
 * @returns Configuration atom for the specified strategy
 */
export const strategyConfigAtomFamily = atomFamily((strategyId: RateLimitStrategy) =>
    atom((get): StrategyConfig => {
        if (strategyId === 'fixed-window')
            return { type: 'fixed-window', config: get(fixedWindowConfigAtom) }
        if (strategyId === 'sliding-window')
            return { type: 'sliding-window', config: get(slidingWindowConfigAtom) }
        if (strategyId === 'token-bucket')
            return { type: 'token-bucket', config: get(tokenBucketConfigAtom) }
        return { type: 'individual-fixed-window', config: get(individualFixedWindowConfigAtom) }
    })
)

/**
 * Adds an event to a strategy's event history
 * @param strategyId The strategy identifier
 */
export const addEventAtomFamily = atomFamily((strategyId: RateLimitStrategy) =>
    atom(null, (get, set, event: RequestEvent) => {
        const currentEvents = get(eventsAtomFamily(strategyId))
        set(eventsAtomFamily(strategyId), [...currentEvents, event])
    })
)

/**
 * Starts simulation for a specific strategy
 * @param strategyId The strategy identifier
 */
export const startSimulationAtomFamily = atomFamily((strategyId: RateLimitStrategy) =>
    atom(null, (get, set) => {
        set(isRunningAtomFamily(strategyId), true)

        if (!get(simulationStartTimeAtomFamily(strategyId))) {
            set(simulationStartTimeAtomFamily(strategyId), Date.now())
        }

        if (strategyId === 'token-bucket') {
            set(lastRefillTimeAtomFamily(strategyId), Date.now())
        }
    })
)

/**
 * Stops simulation for a specific strategy
 * @param strategyId The strategy identifier
 */
export const stopSimulationAtomFamily = atomFamily((strategyId: RateLimitStrategy) =>
    atom(null, (_, set) => {
        set(isRunningAtomFamily(strategyId), false)

        if (strategyId === 'token-bucket') {
            set(lastRefillTimeAtomFamily(strategyId), Date.now())
        }
    })
)

/**
 * Toggles automatic requests for a strategy
 * @param strategyId The strategy identifier
 */
export const toggleAutoRequestsAtomFamily = atomFamily((strategyId: RateLimitStrategy) =>
    atom(null, (get, set) => {
        const autoRequests = get(autoRequestsAtomFamily(strategyId))
        set(autoRequestsAtomFamily(strategyId), !autoRequests)
    })
)

/**
 * Resets simulation state for a specific strategy
 * @param strategyId The strategy identifier
 */
export const resetSimulationAtomFamily = atomFamily((strategyId: RateLimitStrategy) =>
    atom(null, (get, set) => {
        set(isRunningAtomFamily(strategyId), false)
        set(eventsAtomFamily(strategyId), [])
        set(simulationStartTimeAtomFamily(strategyId), null)
        set(autoRequestsAtomFamily(strategyId), false)
        set(autoRequestIntervalAtomFamily(strategyId), 1500)

        if (strategyId === 'token-bucket') {
            const config = get(tokenBucketConfigAtom)
            set(currentTokensAtomFamily(strategyId), config.capacity)
            set(lastRefillTimeAtomFamily(strategyId), 0)
        }
    })
)

/**
 * Updates fixed window configuration and resets its simulation
 * @param newConfig Partial configuration to merge
 */
export const updateFixedWindowConfigAtom = atom(
    null,
    (get, set, newConfig: Partial<FixedWindowConfig>) => {
        const currentConfig = get(fixedWindowConfigAtom)
        set(fixedWindowConfigAtom, { ...currentConfig, ...newConfig })
        set(resetSimulationAtomFamily('fixed-window'))
    }
)

/**
 * Updates sliding window configuration and resets its simulation
 * @param newConfig Partial configuration to merge
 */
export const updateSlidingWindowConfigAtom = atom(
    null,
    (get, set, newConfig: Partial<SlidingWindowConfig>) => {
        const currentConfig = get(slidingWindowConfigAtom)
        set(slidingWindowConfigAtom, { ...currentConfig, ...newConfig })
        set(resetSimulationAtomFamily('sliding-window'))
    }
)

/**
 * Updates token bucket configuration and resets its simulation
 * @param newConfig Partial configuration to merge
 */
export const updateTokenBucketConfigAtom = atom(
    null,
    (get, set, newConfig: Partial<TokenBucketConfig>) => {
        const currentConfig = get(tokenBucketConfigAtom)
        const updatedConfig = { ...currentConfig, ...newConfig }
        set(tokenBucketConfigAtom, updatedConfig)

        if (newConfig.capacity !== undefined) {
            set(currentTokensAtomFamily('token-bucket'), newConfig.capacity)
        }

        set(resetSimulationAtomFamily('token-bucket'))
    }
)

/**
 * Updates individual fixed window configuration and resets its simulation
 * @param newConfig Partial configuration to merge
 */
export const updateIndividualFixedWindowConfigAtom = atom(
    null,
    (get, set, newConfig: Partial<IndividualFixedWindowConfig>) => {
        const currentConfig = get(individualFixedWindowConfigAtom)
        set(individualFixedWindowConfigAtom, { ...currentConfig, ...newConfig })
        set(resetSimulationAtomFamily('individual-fixed-window'))
    }
)

/**
 * Refills tokens for token bucket strategy
 * @param strategyId The strategy identifier (must be 'token-bucket')
 */
export const refillTokensAtomFamily = atomFamily((strategyId: RateLimitStrategy) =>
    atom(null, (get, set) => {
        if (strategyId !== 'token-bucket') return

        const config = get(tokenBucketConfigAtom)
        const currentTokens = get(currentTokensAtomFamily(strategyId))
        const lastRefillTime = get(lastRefillTimeAtomFamily(strategyId))
        const now = Date.now()

        const timeSinceLastRefill = now - lastRefillTime
        if (timeSinceLastRefill >= config.refillTime) {
            const newTokens = Math.min(config.capacity, currentTokens + config.refillRate)
            set(currentTokensAtomFamily(strategyId), newTokens)
            set(lastRefillTimeAtomFamily(strategyId), now)
        }
    })
)

/**
 * Consumes a token from token bucket strategy
 * @param strategyId The strategy identifier (must be 'token-bucket')
 */
export const consumeTokenAtomFamily = atomFamily((strategyId: RateLimitStrategy) =>
    atom(null, (get, set) => {
        if (strategyId !== 'token-bucket') return

        const currentTokens = get(currentTokensAtomFamily(strategyId))
        if (currentTokens > 0) {
            set(currentTokensAtomFamily(strategyId), Math.max(0, currentTokens - 1))
        }
    })
)
