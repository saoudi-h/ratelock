import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'

/**
 * Global real-time clock atom (system time)
 * Updated separately from simulation time
 */
export const realTimeNowAtom = atom<number>(Date.now())

/**
 * Action to update the global real-time clock
 */
export const updateRealTimeNowAtom = atom(
  null,
  (_, set) => {
    set(realTimeNowAtom, Date.now())
  }
)

/**
 * Strategy-specific simulation time atom
 * Maintains independent time state for each strategy
 * @returns Atom containing current simulation time in milliseconds
 */
export const simulationTimeAtomFamily = atomFamily(() =>
  atom<number>(Date.now())
)

/**
 * Last known timestamp before pause for each strategy
 * Used to handle time jumps when resuming simulations
 * @returns Atom containing the last known timestamp
 */
export const lastKnownTimeAtomFamily = atomFamily(() =>
  atom<number>(Date.now())
)

/**
 * Simulation running state for each strategy
 * @returns Atom containing boolean simulation state
 */
export const isSimulationRunningAtomFamily = atomFamily(() =>
  atom<boolean>(false)
)

/**
 * Simulation start time for each strategy
 * @returns Atom containing start timestamp or null if not started
 */
export const simulationStartTimeAtomFamily = atomFamily(() =>
  atom<number | null>(null)
)
