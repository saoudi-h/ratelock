import type { BaseStrategyOptions, TypedStrategyFactory } from './types'

export class StrategyRegistry {
    private static factories = new Map<string, TypedStrategyFactory<any, any>>()

    static register<T, O extends BaseStrategyOptions>(
        name: string,
        factory: TypedStrategyFactory<T, O>
    ): void {
        this.factories.set(name, factory)
    }

    static get<T, O extends BaseStrategyOptions>(
        name: string
    ): TypedStrategyFactory<T, O> | undefined {
        return this.factories.get(name) as TypedStrategyFactory<T, O> | undefined
    }

    static list(): string[] {
        return Array.from(this.factories.keys())
    }
}
