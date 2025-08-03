import type { InferStrategyResult } from './behaviors'

export abstract class Strategy<T> {
    abstract check(identifier: string): Promise<InferStrategyResult<T>>
}

export interface StrategyFactory<ConcreteStrategy extends Strategy<any>> {
    (context: { storage: Storage }): ConcreteStrategy
}
