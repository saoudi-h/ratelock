import {
    addEventAtom,
    autoIntervalAtomFamily,
    autoRequestsAtomFamily,
    configAtom,
    eventsAtomFamily,
} from '@/simulation/atoms'
import { checkRateLimit } from '@/simulation/engine'
import type { StrategyId, StrategySpecificConfig } from '@/simulation/types'
import { useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'

let eventIdCounter = 0

export function useNow(throttleMs = 16, isPlaying = true) {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        if (!isPlaying) return

        let frameId = 0
        let lastUpdate = 0

        const tick = (time: number) => {
            if (time - lastUpdate >= throttleMs) {
                lastUpdate = time
                setNow(Date.now())
            }
            frameId = window.requestAnimationFrame(tick)
        }

        frameId = window.requestAnimationFrame(tick)
        return () => window.cancelAnimationFrame(frameId)
    }, [throttleMs, isPlaying])

    return now
}

export function useSimulation(strategyId: StrategyId, onAutoRequestTriggered?: () => void, isPlaying = true) {
    const events = useAtomValue(eventsAtomFamily(strategyId))
    const autoRequests = useAtomValue(autoRequestsAtomFamily(strategyId))
    const setAutoRequests = useSetAtom(autoRequestsAtomFamily(strategyId))
    const autoInterval = useAtomValue(autoIntervalAtomFamily(strategyId))
    const setAutoInterval = useSetAtom(autoIntervalAtomFamily(strategyId))
    const config = useAtomValue(configAtom)
    const addEvent = useSetAtom(addEventAtom)

    const autoRequestsRef = useRef(autoRequests)
    const configRef = useRef(config)
    const onAutoRequestTriggeredRef = useRef(onAutoRequestTriggered)
    const isPlayingRef = useRef(isPlaying)

    useEffect(() => {
        autoRequestsRef.current = autoRequests
        configRef.current = config
        onAutoRequestTriggeredRef.current = onAutoRequestTriggered
        isPlayingRef.current = isPlaying
    }, [autoRequests, config, onAutoRequestTriggered, isPlaying])

    const sendRequest = useCallback(async () => {
        if (!isPlayingRef.current) return null

        const currentConfig = configRef.current[strategyId]
        const userId = 'demo-user'
        const result = await checkRateLimit(strategyId, currentConfig, userId)

        const event = {
            id: `event-${++eventIdCounter}`,
            timestamp: Date.now(),
            userId,
            allowed: result.allowed,
            remaining: result.remaining,
            result,
            strategyId,
        }

        addEvent(event)
        return event
    }, [strategyId, addEvent])

    useEffect(() => {
        if (!autoRequests || !isPlaying) return

        const requestInterval = setInterval(() => {
            if (autoRequestsRef.current && isPlayingRef.current) {
                if (onAutoRequestTriggeredRef.current) {
                    onAutoRequestTriggeredRef.current()
                } else {
                    sendRequest()
                }
            }
        }, autoInterval)

        return () => clearInterval(requestInterval)
    }, [autoInterval, autoRequests, isPlaying, sendRequest])

    const strategyConfig = config[strategyId] as StrategySpecificConfig

    return {
        events,
        autoRequests,
        setAutoRequests,
        autoInterval,
        setAutoInterval,
        sendRequest,
        config: strategyConfig,
    }
}
