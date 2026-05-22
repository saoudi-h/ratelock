import { useEffect, useRef, useCallback, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import type { StrategyId, StrategySpecificConfig } from '@/simulation/types'
import {
    eventsAtomFamily,
    autoRequestsAtomFamily,
    autoIntervalAtomFamily,
    configAtom,
    addEventAtom,
} from '@/simulation/atoms'
import { checkRateLimit } from '@/simulation/engine'

let eventIdCounter = 0

export function useNow(throttleMs = 80) {
    const [now, setNow] = useState(Date.now())

    useEffect(() => {
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
    }, [throttleMs])

    return now
}

export function useSimulation(strategyId: StrategyId) {
    const events = useAtomValue(eventsAtomFamily(strategyId))
    const autoRequests = useAtomValue(autoRequestsAtomFamily(strategyId))
    const setAutoRequests = useSetAtom(autoRequestsAtomFamily(strategyId))
    const autoInterval = useAtomValue(autoIntervalAtomFamily(strategyId))
    const setAutoInterval = useSetAtom(autoIntervalAtomFamily(strategyId))
    const config = useAtomValue(configAtom)
    const addEvent = useSetAtom(addEventAtom)

    const autoRequestsRef = useRef(autoRequests)
    const autoIntervalRef = useRef(autoInterval)
    const configRef = useRef(config)

    autoRequestsRef.current = autoRequests
    autoIntervalRef.current = autoInterval
    configRef.current = config

    const sendRequest = useCallback(async () => {
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
        if (!autoRequests) return

        const requestInterval = setInterval(() => {
            if (autoRequestsRef.current) {
                sendRequest()
            }
        }, autoIntervalRef.current)

        return () => clearInterval(requestInterval)
    }, [autoRequests, sendRequest])

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
