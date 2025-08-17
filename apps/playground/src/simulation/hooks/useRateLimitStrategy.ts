'use client'
import { sendRateLimitRequest } from '@/simulation/store/api'
import {
  addEventAtomFamily,
  autoRequestIntervalAtomFamily,
  autoRequestsAtomFamily,
  eventsAtomFamily,
  hasInitialStartedAtomFamily,
  strategyConfigAtomFamily,
  toggleAutoRequestsAtomFamily,
} from '@/simulation/store/atoms'
import {
  isSimulationRunningAtomFamily,
  simulationStartTimeAtomFamily
} from '@/simulation/store/simulationTimeAtoms'
import type { RateLimitStrategy, StrategyConfig, StrategyHookReturn } from '@/simulation/types'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { resetSimulationAtomFamily, startSimulationAtomFamily, stopSimulationAtomFamily } from '../store/simulationControlAtoms'

export function useRateLimitStrategy(strategyId: RateLimitStrategy): StrategyHookReturn {
  const isRunning = useAtomValue(isSimulationRunningAtomFamily(strategyId))
  const [now, setNow] = useState(Date.now())
  const simulationStartTime = useAtomValue(simulationStartTimeAtomFamily(strategyId))
  const events = useAtomValue(eventsAtomFamily(strategyId))
  const autoRequests = useAtomValue(autoRequestsAtomFamily(strategyId))
  const [autoRequestInterval, setAutoRequestInterval] = useAtom(
    autoRequestIntervalAtomFamily(strategyId)
  )
  const toggleAutoRequestsAction = useSetAtom(toggleAutoRequestsAtomFamily(strategyId))
  const currentStrategy = useAtomValue(strategyConfigAtomFamily(strategyId))

  const startSimulation = useSetAtom(startSimulationAtomFamily(strategyId))
  const stopSimulation = useSetAtom(stopSimulationAtomFamily(strategyId))
  const resetSimulation = useSetAtom(resetSimulationAtomFamily(strategyId))
  const [hasInitialStarted, setHasInitialStarted] = useAtom(hasInitialStartedAtomFamily(strategyId))
  
  const toggleAutoRequests = useCallback(() => {
    toggleAutoRequestsAction()
  }, [toggleAutoRequestsAction])

  const addEvent = useSetAtom(addEventAtomFamily(strategyId))
  const autoRequestIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const sendRequest = useCallback(
    async (timestamp: number, userId: string, strategy: StrategyConfig) => {
      const event = await sendRateLimitRequest(timestamp, userId, strategy)
      if (event) {
        addEvent(event)
      }
    },
    [addEvent]
  )

  useEffect(() => {
    if (!isRunning) return
    
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 50)
    
    return () => clearInterval(interval)
  }, [isRunning])

  useEffect(() => {
    if (autoRequestIntervalRef.current) {
      clearInterval(autoRequestIntervalRef.current)
      autoRequestIntervalRef.current = undefined
    }
    
    if (isRunning && autoRequests) {
      autoRequestIntervalRef.current = setInterval(() => {
        sendRequest(Date.now(), 'user-1', currentStrategy)
      }, autoRequestInterval)
    }
    
    return () => {
      if (autoRequestIntervalRef.current) {
        clearInterval(autoRequestIntervalRef.current)
      }
    }
  }, [isRunning, autoRequests, autoRequestInterval, sendRequest, currentStrategy])

  const sendManualRequest = useCallback(() => {
    sendRequest(now, 'user-1', currentStrategy)
  }, [sendRequest, now, currentStrategy])


  useEffect(() => {
    if (!isRunning && !hasInitialStarted) {
      setHasInitialStarted(true)
      startSimulation()
    }
  }, [isRunning, hasInitialStarted, startSimulation, setHasInitialStarted])

  return {
    isRunning,
    events,
    now,
    simulationStartTime,
    autoRequests,
    autoRequestInterval,
    toggleAutoRequests,
    sendManualRequest,
    setAutoRequestInterval,
    startSimulation,
    stopSimulation,
    resetSimulation,
  }
}