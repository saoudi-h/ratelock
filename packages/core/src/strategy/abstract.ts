import type { Storage } from '../storage/storage'
import type { InferStrategyResult } from './capabilities'
import type { StrategyStats } from './types'

export abstract class Strategy<TCapabilities, TOptions = unknown> {
    abstract readonly metadata: Readonly<{
        name: string
        version?: string
        memoryEfficient: boolean
        supportsBatch: boolean
    }>

    constructor(
        protected readonly storage: Storage,
        protected options: TOptions
    ) {}

    abstract check(identifier: string): Promise<InferStrategyResult<TCapabilities>>

    cleanup?(identifier: string): Promise<void>
    getStats?(): Promise<StrategyStats>
    checkBatch?(identifiers: string[]): Promise<Array<InferStrategyResult<TCapabilities>>>
}
