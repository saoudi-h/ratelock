import type { Storage } from '../storage/storage'
import type { InferStrategyResult } from './behaviors'


export interface StrategyMetadata {
    readonly name: string
    readonly version?: string
    readonly memoryEfficient: boolean
    readonly supportsBatch: boolean
}


export interface ValidationConfig<T = unknown> {
    validate?(options: T): void
    normalize?(options: T): T
}


export abstract class Strategy<T, TOptions = unknown> {
    abstract readonly metadata: StrategyMetadata
    protected readonly validation?: ValidationConfig<TOptions>

    constructor(
        protected readonly storage: Storage,
        protected options: TOptions
    ) {
        // Validation automatique des options si configurée
        this.validation?.validate?.(options)
        // Normalisation des options
        if (this.validation?.normalize) {
            this.options = this.validation.normalize(options)
        }
    }

    abstract check(identifier: string): Promise<InferStrategyResult<T>>

    /**
     * Méthode optionnelle pour le nettoyage des ressources
     */

    cleanup?(identifier: string): Promise<void>

    /**
     * Méthode optionnelle pour les statistiques
     */
    getStats?(): Promise<StrategyStats>

    /**
     * Méthode optionnelle pour la validation en lot
     */
    checkBatch?(identifiers: string[]): Promise<Array<InferStrategyResult<T>>>
}

/**
 * Interface pour les statistiques des stratégies
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
    // Futurs ajouts possibles:
    // logger?: Logger;
    // metrics?: MetricsCollector;
    // config?: GlobalConfig;
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
 * Builder pour créer des stratégies de manière fluide
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


export function createStrategy<T extends Strategy<any, any>, O extends BaseStrategyOptions>(
    factory: TypedStrategyFactory<T, O>
): (options: O) => StrategyBuilder<T> {
    return (options: O) => new StrategyBuilder(factory, options);
}

export interface FixedWindowOptions extends BaseStrategyOptions {
    limit: number
    windowMs: number
    startTimeMs?: number
}

// Validation spécifique à Fixed Window
const fixedWindowValidation: ValidationConfig<FixedWindowOptions> = {
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

export class TypedFixedWindowStrategy extends Strategy<WindowedLimited, FixedWindowOptions> {
    readonly metadata: StrategyMetadata = {
        name: 'fixed-window',
        version: '1.0.0',
        memoryEfficient: true,
        supportsBatch: true,
    }

    protected override readonly validation: ValidationConfig<FixedWindowOptions> =
        fixedWindowValidation

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


export const createTypedFixedWindowStrategy: TypedStrategyFactory<
    TypedFixedWindowStrategy,
    FixedWindowOptions
> = options => context => new TypedFixedWindowStrategy(context.storage, options)


StrategyRegistry.register('fixed-window', createTypedFixedWindowStrategy)


export const FixedWindow: (options: FixedWindowOptions) => StrategyBuilder<TypedFixedWindowStrategy> = createStrategy(
    createTypedFixedWindowStrategy
)
