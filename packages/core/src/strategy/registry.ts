import type { BaseStrategyOptions, StrategyFactory } from './types'

export class StrategyRegistry {
    private static factories = new Map<string, StrategyFactory<any, any>>()

    static register<T, O extends BaseStrategyOptions>(
        name: string,
        factory: StrategyFactory<T, O>
    ): void {
        this.factories.set(name, factory)
    }

    static get<T, O extends BaseStrategyOptions>(name: string): StrategyFactory<T, O> | undefined {
        return this.factories.get(name) as StrategyFactory<T, O> | undefined
    }

    static list(): string[] {
        return Array.from(this.factories.keys())
    }
}
