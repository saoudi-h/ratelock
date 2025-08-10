import type { Storage } from '../storage/storage'
import type { BaseStrategyOptions } from './types'

export interface StrategyValidator<TOptions> {
    validate(options: TOptions): void
    normalize(options: TOptions): TOptions
}

export function createStrategyFactory<TStrategy, TOptions extends BaseStrategyOptions>(
    validator: StrategyValidator<TOptions>,
    construct: (storage: Storage, options: TOptions) => TStrategy
): (storage: Storage, options: TOptions) => TStrategy {
    return (storage: Storage, options: TOptions): TStrategy => {
        validator.validate(options)
        const normalized = validator.normalize(options)
        return construct(storage, normalized)
    }
}
