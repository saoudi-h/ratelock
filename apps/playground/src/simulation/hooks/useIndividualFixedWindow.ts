'use client'
import {
    eventsAtomFamily,
    individualFixedWindowConfigAtom,
    updateIndividualFixedWindowConfigAtom,
} from '@/simulation/store/atoms'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'
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
    const [windows, setWindows] = useState<WindowState[]>([])
    const lastEventCount = useRef(0)
    const cleanupIntervalRef = useRef<NodeJS.Timeout>(undefined)

    useEffect(() => {
        if (events.length === 0) {
            setWindows([])
            lastEventCount.current = 0
        }
    }, [events.length])

    useEffect(() => {
        if (events.length <= lastEventCount.current) return

        const newEvents = events.slice(lastEventCount.current)
        lastEventCount.current = events.length

        newEvents.forEach(event => {
            setWindows(currentWindows => {
                const belongsToExistingWindow = currentWindows.some(
                    window => event.timestamp >= window.start && event.timestamp < window.end
                )

                if (belongsToExistingWindow) {
                    return currentWindows.map(window => {
                        if (event.timestamp >= window.start && event.timestamp < window.end) {
                            return {
                                ...window,
                                eventIds: [...window.eventIds, event.id],
                            }
                        }
                        return window
                    })
                } else {
                    const newWindow: WindowState = {
                        id: `window-${event.timestamp}`,
                        start: event.timestamp,
                        end: event.timestamp + config.windowMs,
                        eventIds: [event.id],
                    }
                    return [...currentWindows, newWindow]
                }
            })
        })
    }, [events, config.windowMs])

    useEffect(() => {
        if (!strategyHook.isRunning) {
            if (cleanupIntervalRef.current) {
                clearInterval(cleanupIntervalRef.current)
                cleanupIntervalRef.current = undefined
            }
            return
        }

        cleanupIntervalRef.current = setInterval(() => {
            const now = strategyHook.now
            const timelineBuffer = config.windowMs * 3
            setWindows(currentWindows =>
                currentWindows.filter(window => window.end > now - timelineBuffer)
            )
        }, 5000)

        return () => {
            if (cleanupIntervalRef.current) {
                clearInterval(cleanupIntervalRef.current)
                cleanupIntervalRef.current = undefined
            }
        }
    }, [config.windowMs, strategyHook.now, strategyHook.isRunning])

    useEffect(() => {
        return () => {
            if (cleanupIntervalRef.current) {
                clearInterval(cleanupIntervalRef.current)
            }
        }
    }, [])

    return {
        ...strategyHook,
        config,
        updateConfig,
        windows,
    }
}
