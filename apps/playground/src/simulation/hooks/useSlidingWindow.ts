'use client'

import { slidingWindowConfigAtom, updateSlidingWindowConfigAtom } from '@/simulation/store/atoms'
import { useAtomValue, useSetAtom } from 'jotai'
import { useRateLimitStrategy } from './useRateLimitStrategy'

export function useSlidingWindow() {
    const config = useAtomValue(slidingWindowConfigAtom)
    const updateConfig = useSetAtom(updateSlidingWindowConfigAtom)
    const strategyHook = useRateLimitStrategy('sliding-window')

    return {
        ...strategyHook,
        config,
        updateConfig,
    }
}
