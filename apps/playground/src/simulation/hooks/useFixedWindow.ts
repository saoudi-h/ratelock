'use client'
import { fixedWindowConfigAtom, updateFixedWindowConfigAtom } from '@/simulation/store/atoms'
import { useAtomValue, useSetAtom } from 'jotai'
import { useMemo } from 'react'
import { useRateLimitStrategy } from './useRateLimitStrategy'

export function useFixedWindow() {
    const config = useAtomValue(fixedWindowConfigAtom)
    const updateConfig = useSetAtom(updateFixedWindowConfigAtom)
    const strategyHook = useRateLimitStrategy('fixed-window')

    const currentWindowStart = useMemo(() => {
        if (strategyHook.events.length > 0) {
            const lastEvent = strategyHook.events[strategyHook.events.length - 1]
            if (lastEvent.result?.reset) {
                return lastEvent.result.reset - config.windowMs
            }
        }

        return strategyHook.simulationStartTime
    }, [strategyHook.events, config.windowMs, strategyHook.simulationStartTime])

    return {
        ...strategyHook,
        config,
        updateConfig,
        currentWindowStart,
    }
}
