import type { Storage } from '../storage/storage'
import type { InferStrategyResult } from './behaviors'

/**
 * Public metadata describing a Strategy implementation.
 */
export interface StrategyMetadata {
    readonly name: string
    readonly version?: string
    readonly memoryEfficient: boolean
    readonly supportsBatch: boolean
}

/**
 * Options validator/normalizer used by factories to ensure option correctness.
 */
export interface StrategyValidator<TOptions> {
    /**
     * Validate user-provided options; must throw on invalid input.
     */
    validate(options: TOptions): void
    /**
     * Normalize user-provided options (fill defaults, coerce values, etc.).
     */
    normalize(options: TOptions): TOptions
}

/**
 * Minimal abstract Strategy. Validation/normalization is NOT handled here anymore.
 * Factories are responsible for building valid, normalized instances.
 */
export abstract class Strategy<T, TOptions = unknown> {
    abstract readonly metadata: StrategyMetadata

    constructor(
        protected readonly storage: Storage,
        protected options: TOptions
    ) {}

    abstract check(identifier: string): Promise<InferStrategyResult<T>>

    /**
     * Optional resource cleanup hook.
     */
    cleanup?(identifier: string): Promise<void>

    /**
     * Optional statistics hook.
     */
    getStats?(): Promise<StrategyStats>

    /**
     * Optional batch-check hook.
     */
    checkBatch?(identifiers: string[]): Promise<Array<InferStrategyResult<T>>>
}

/**
 * Stats interface for strategies.
 */
export interface StrategyStats {
    totalChecks: number
    allowedChecks: number
    deniedChecks: number
    averageResponseTime: number
    memoryUsage?: number // bytes
    activeIdentifiers?: number
}

export interface StrategyContext {
    storage: Storage
    // Future extensions: logger, metrics, global config, etc.
}

export interface BaseStrategyOptions {
    prefix?: string
    enableStats?: boolean
    cleanupInterval?: number
}

export type TypedStrategyFactory<
    TStrategy extends Strategy<any, any>,
    TOptions extends BaseStrategyOptions = BaseStrategyOptions,
> = (options: TOptions) => (context: StrategyContext) => TStrategy

export class StrategyRegistry {
    private static factories = new Map<string, TypedStrategyFactory<any, any>>()

    static register<T extends Strategy<any, any>, O extends BaseStrategyOptions>(
        name: string,
        factory: TypedStrategyFactory<T, O>
    ): void {
        this.factories.set(name, factory)
    }

    static get<T extends Strategy<any, any>, O extends BaseStrategyOptions>(
        name: string
    ): TypedStrategyFactory<T, O> | undefined {
        return this.factories.get(name) as TypedStrategyFactory<T, O> | undefined
    }

    static list(): string[] {
        return Array.from(this.factories.keys())
    }
}

/**
 * Fluent builder for strategies.
 */
export class StrategyBuilder<T extends Strategy<any, any>> {
    constructor(
        private factory: TypedStrategyFactory<T, any>,
        private options: any
    ) {}

    withStorage(storage: Storage): T {
        const context: StrategyContext = { storage }
        return this.factory(this.options)(context)
    }

    withContext(context: StrategyContext): T {
        return this.factory(this.options)(context)
    }
}

/**
 * Helper to create a builder from a strategy factory.
 */
export function createStrategy<T extends Strategy<any, any>, O extends BaseStrategyOptions>(
    factory: TypedStrategyFactory<T, O>
): (options: O) => StrategyBuilder<T> {
    return (options: O) => new StrategyBuilder(factory, options)
}

/**
 * Fixed-window options.
 */
export interface FixedWindowOptions extends BaseStrategyOptions {
    limit: number
    windowMs: number
    startTimeMs?: number
}

/**
 * Fixed-window validator providing validation and normalization.
 */
export const fixedWindowValidator: StrategyValidator<FixedWindowOptions> = {
    validate(options) {
        if (options.limit <= 0) {
            throw new Error('limit must be positive')
        }
        if (options.windowMs <= 0) {
            throw new Error('windowMs must be positive')
        }
        if (options.startTimeMs !== undefined && options.startTimeMs < 0) {
            throw new Error('startTimeMs must be non-negative')
        }
    },
    normalize(options) {
        return {
            ...options,
            startTimeMs: options.startTimeMs ?? 0,
            prefix: options.prefix ?? 'fw',
            enableStats: options.enableStats ?? false,
            cleanupInterval: options.cleanupInterval ?? 60_000,
        }
    },
}

import type { WindowedLimited } from './behaviors'

/**
 * Concrete fixed-window strategy. Assumes options are already validated/normalized by a factory.
 */
export class TypedFixedWindowStrategy extends Strategy<WindowedLimited, FixedWindowOptions> {
    readonly metadata: StrategyMetadata = {
        name: 'fixed-window',
        version: '1.0.0',
        memoryEfficient: true,
        supportsBatch: true,
    }

    override async check(identifier: string): Promise<InferStrategyResult<WindowedLimited>> {
        const now = Date.now()
        const { limit, windowMs, startTimeMs = 0, prefix = 'fw' } = this.options

        const currentWindowIndex = Math.floor((now - startTimeMs) / windowMs)
        const windowKey = `${prefix}:${identifier}:${currentWindowIndex}`

        const windowEndTime = startTimeMs + (currentWindowIndex + 1) * windowMs
        const ttlMs = Math.max(1, windowEndTime - now)

        const currentCount = await this.storage.increment(windowKey, ttlMs)
        const allowed = currentCount <= limit

        if (!allowed && currentCount > limit) {
            const currentValue = await this.storage.get(windowKey)
            if (currentValue) {
                const decremented = Math.max(0, parseInt(currentValue, 10) - 1)
                await this.storage.set(windowKey, decremented.toString(), ttlMs)
            }
        }

        const usedCount = allowed ? currentCount : limit
        const remaining = Math.max(0, limit - usedCount)

        return {
            allowed,
            remaining,
            reset: windowEndTime,
        }
    }

    override async checkBatch(
        identifiers: string[]
    ): Promise<Array<InferStrategyResult<WindowedLimited>>> {
        const results: Array<InferStrategyResult<WindowedLimited>> = []
        for (const identifier of identifiers) {
            results.push(await this.check(identifier))
        }
        return results
    }
}

/**
 * Generic factory creator that wires validation and normalization into the construction step.
 * It returns a factory function producing Strategy instances with validated/normalized options.
 */
export function createStrategyFactory<TStrategy extends Strategy<any, any>, TOptions extends BaseStrategyOptions>(
    validator: StrategyValidator<TOptions>,
    /**
     * Concrete constructor that, given storage and normalized options, returns a Strategy instance.
     */
    construct: (storage: Storage, options: TOptions) => TStrategy
): (storage: Storage, options: TOptions) => TStrategy {
    return (storage: Storage, options: TOptions): TStrategy => {
        validator.validate(options)
        const normalized = validator.normalize(options)
        return construct(storage, normalized)
    }
}

/**
 * Concrete fixed-window factory using the generic creator.
 */
export const createFixedWindowStrategy = createStrategyFactory<TypedFixedWindowStrategy, FixedWindowOptions>(
    fixedWindowValidator,
    (storage, options) => new TypedFixedWindowStrategy(storage, options)
)

/**
 * Backward-compatible registry wiring for the typed builder API.
 */
export const createTypedFixedWindowStrategy: TypedStrategyFactory<
    TypedFixedWindowStrategy,
    FixedWindowOptions
> = options => context => createFixedWindowStrategy(context.storage, options)

StrategyRegistry.register('fixed-window', createTypedFixedWindowStrategy)

export const FixedWindow: (
    options: FixedWindowOptions
) => StrategyBuilder<TypedFixedWindowStrategy> = createStrategy(createTypedFixedWindowStrategy)
