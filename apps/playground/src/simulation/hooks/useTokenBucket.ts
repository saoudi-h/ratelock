'use client'
import {
    consumeTokenAtomFamily,
    currentTokensAtomFamily,
    eventsAtomFamily,
    refillTokensAtomFamily,
    tokenBucketConfigAtom,
    updateTokenBucketConfigAtom,
    lastRefillTimeAtomFamily,
} from '@/simulation/store/atoms'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import { useRateLimitStrategy } from './useRateLimitStrategy'
import { isSimulationRunningAtomFamily } from '@/simulation/store/simulationTimeAtoms'

export function useTokenBucket() {
    const config = useAtomValue(tokenBucketConfigAtom)
    const updateConfig = useSetAtom(updateTokenBucketConfigAtom)
    const strategyHook = useRateLimitStrategy('token-bucket')
    
    const now = strategyHook.now
    
    const currentTokens = useAtomValue(currentTokensAtomFamily('token-bucket'))
    const events = useAtomValue(eventsAtomFamily('token-bucket'))
    const isRunning = useAtomValue(isSimulationRunningAtomFamily('token-bucket'))
    const refillTokens = useSetAtom(refillTokensAtomFamily('token-bucket'))
    const consumeToken = useSetAtom(consumeTokenAtomFamily('token-bucket'))
    const lastRefillTime = useAtomValue(lastRefillTimeAtomFamily('token-bucket'))
    const setLastRefillTime = useSetAtom(lastRefillTimeAtomFamily('token-bucket'))
    
    const refillIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
    
    useEffect(() => {
        if (isRunning && lastRefillTime === 0) {
            setLastRefillTime(now)
        }
    }, [isRunning, now, lastRefillTime, setLastRefillTime])
    
    useEffect(() => {
        if (!isRunning) {
            if (refillIntervalRef.current) {
                clearInterval(refillIntervalRef.current)
                refillIntervalRef.current = undefined
            }
            return
        }
        
        refillIntervalRef.current = setInterval(() => {
            refillTokens()
        }, 100)
        
        return () => {
            if (refillIntervalRef.current) {
                clearInterval(refillIntervalRef.current)
                refillIntervalRef.current = undefined
            }
        }
    }, [isRunning, refillTokens])
    
    useEffect(() => {
        const lastEvent = events[events.length - 1]
        if (lastEvent && lastEvent.allowed) {
            consumeToken()
        }
    }, [events, consumeToken])
    
    useEffect(() => {
        return () => {
            if (refillIntervalRef.current) {
                clearInterval(refillIntervalRef.current)
            }
        }
    }, [])
    
    return {
        ...strategyHook,
        config,
        currentTokens,
        updateConfig,
    }
}