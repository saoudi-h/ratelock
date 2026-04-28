'use client'
import {
    eventsAtomFamily,
    individualFixedWindowConfigAtom,
    updateIndividualFixedWindowConfigAtom,
} from '@/simulation/store/atoms'
import { useAtomValue, useSetAtom } from 'jotai'
import { useMemo } from 'react'
import { useRateLimitStrategy } from './useRateLimitStrategy'

export type WindowState = {
    id: string
    start: number
    end: number
    eventIds: string[]
}

export function useIndividualFixedWindow() {
    const strategyHook = useRateLimitStrategy('individual-fixed-window')
    const config = useAtomValue(individualFixedWindowConfigAtom)
    const updateConfig = useSetAtom(updateIndividualFixedWindowConfigAtom)

    const events = useAtomValue(eventsAtomFamily('individual-fixed-window'))

    // Calculate windows directly from events using useMemo
    const windows = useMemo<WindowState[]>(() => {
        if (events.length === 0) return []

        const result: WindowState[] = []
        events.forEach(event => {
            const windowIndex = result.findIndex(
                window => event.timestamp >= window.start && event.timestamp < window.end
            )

            if (windowIndex !== -1) {
                const existingWindow = result[windowIndex]!
                result[windowIndex] = {
                    ...existingWindow,
                    eventIds: [...existingWindow.eventIds, event.id],
                }
            } else {
                const newWindow: WindowState = {
                    id: `window-${event.timestamp}`,
                    start: event.timestamp,
                    end: event.timestamp + config.windowMs,
                    eventIds: [event.id],
                }
                result.push(newWindow)
            }
        })
        return result
    }, [events, config.windowMs])

    return {
        ...strategyHook,
        config,
        updateConfig,
        windows,
    }
}
