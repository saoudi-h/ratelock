import type { BaseStrategyOptions, StrategyContext, StrategyFactory } from './types'

export class StrategyBuilder<TStrategy, TOptions extends BaseStrategyOptions> {
    constructor(
        private readonly factory: StrategyFactory<TStrategy, TOptions>,
        private readonly options: TOptions
    ) {}

    withStorage(storage: StrategyContext['storage']): TStrategy {
        const context: StrategyContext = { storage }
        return this.factory(this.options)(context)
    }

    withContext(context: StrategyContext): TStrategy {
        return this.factory(this.options)(context)
    }
}
export function createStrategy<TStrategy, TOptions extends BaseStrategyOptions>(
    factory: StrategyFactory<TStrategy, TOptions>
): (options: TOptions) => StrategyBuilder<TStrategy, TOptions> {
    return (options: TOptions) => new StrategyBuilder(factory, options)
}
