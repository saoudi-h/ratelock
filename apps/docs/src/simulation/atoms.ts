import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import type { StrategyId, StrategyConfig, StrategySpecificConfig, RequestEvent } from './types'
import { DEFAULT_CONFIGS } from './types'
import { destroyLimiter } from './engine'

const MAX_EVENTS = 160

export const activeStrategyAtom = atom<StrategyId>('fixed-window')

export const configAtom = atom<StrategyConfig>(DEFAULT_CONFIGS)

export const eventsAtomFamily = atomFamily((_strategyId: StrategyId) => atom<RequestEvent[]>([]))

export const isRunningAtomFamily = atomFamily((_strategyId: StrategyId) => atom(false))

export const autoRequestsAtomFamily = atomFamily((_strategyId: StrategyId) => atom(true))

export const autoIntervalAtomFamily = atomFamily((strategyId: StrategyId) =>
    atom(strategyId === 'token-bucket' ? 180 : strategyId === 'sliding-window' ? 240 : 300)
)

export const isSimulationVisibleAtom = atom(false)

export const startSimulationAtom = atom(null, (get, set, _strategyId: StrategyId) => {
    set(isRunningAtomFamily(_strategyId), true)
})

export const stopSimulationAtom = atom(null, (get, set, _strategyId: StrategyId) => {
    set(isRunningAtomFamily(_strategyId), false)
})

export const addEventAtom = atom(null, (get, set, event: RequestEvent) => {
    const events = get(eventsAtomFamily(event.strategyId))
    set(eventsAtomFamily(event.strategyId), [...events, event].slice(-MAX_EVENTS))
})

export const resetSimulationAtom = atom(null, async (get, set, strategyId: StrategyId) => {
    set(isRunningAtomFamily(strategyId), false)
    set(eventsAtomFamily(strategyId), [])
    await destroyLimiter(strategyId)
})

export const updateConfigAtom = atom(
    (get) => get(configAtom),
    (get, set, strategyId: StrategyId, updates: Partial<StrategySpecificConfig>) => {
        const current = get(configAtom)
        const strategyConfig = current[strategyId]
        set(configAtom, {
            ...current,
            [strategyId]: { ...strategyConfig, ...updates },
        })
        set(eventsAtomFamily(strategyId), [])
        void destroyLimiter(strategyId)
    }
)
