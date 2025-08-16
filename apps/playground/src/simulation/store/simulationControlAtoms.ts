import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import {
  isSimulationRunningAtomFamily,
  simulationStartTimeAtomFamily
} from './simulationTimeAtoms'
import {
  eventsAtomFamily,
  autoRequestsAtomFamily,
  autoRequestIntervalAtomFamily
} from './atoms'

/**
 * Starts simulation for a specific strategy
 * @param strategyId Identifier for the strategy
 * @returns Atom that when committed will start the simulation
 */
export const startSimulationAtomFamily = atomFamily((strategyId: string) =>
  atom(
    null,
    (get, set) => {
      set(isSimulationRunningAtomFamily(strategyId), true)
      if (!get(simulationStartTimeAtomFamily(strategyId))) {
        set(simulationStartTimeAtomFamily(strategyId), Date.now())
      }
    }
  )
)

/**
 * Stops simulation for a specific strategy
 * @param strategyId Identifier for the strategy
 * @returns Atom that when committed will stop the simulation
 */
export const stopSimulationAtomFamily = atomFamily((strategyId: string) =>
  atom(
    null,
    (_, set) => {
      set(isSimulationRunningAtomFamily(strategyId), false)
    }
  )
)

/**
 * Resets simulation state for a specific strategy
 * @param strategyId Identifier for the strategy
 * @returns Atom that when committed will:
 * - Stop the simulation
 * - Clear start time
 * - Clear all events
 * - Disable auto requests
 * - Reset request interval to default (1000ms)
 */
export const resetSimulationAtomFamily = atomFamily((strategyId: string) =>
  atom(
    null,
    (_, set) => {
      set(isSimulationRunningAtomFamily(strategyId), false)
      set(simulationStartTimeAtomFamily(strategyId), null)
      set(eventsAtomFamily(strategyId), [])
      set(autoRequestsAtomFamily(strategyId), false)
      set(autoRequestIntervalAtomFamily(strategyId), 1000)
    }
  )
)
