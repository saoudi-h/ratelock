import type { InferStrategyResult } from '../strategy/behaviors'
import type { Strategy } from '../strategy/strategy'
import type { Storage } from '../storage/storage'
import { CachedStorage } from './cached-storage'
import type { CacheConfig } from './l1-cache'
import type { BatchConfig } from './batch-processor'
import { LazyTimestampCleaner } from './lazy-timestamp-cleaner'
import type { LazyCleanupConfig } from './lazy-timestamp-cleaner'

type InferLimiterResult<S> = S extends Strategy<infer T, any> ? InferStrategyResult<T> : never

export class OptimizedRateLimiter<S extends Strategy<any, any>> {
  private readonly cachedStorage: CachedStorage
  private readonly timestampCleaner: LazyTimestampCleaner

  constructor(
    // @ts-expect-error baseStorage is not used
    private readonly baseStorage: Storage,
    private readonly strategy: S,
    // @ts-expect-error config is not used
    private readonly config: {
      cache: CacheConfig
      batch?: BatchConfig
      lazyCleanup: LazyCleanupConfig
      prefix?: string
    }
  ) {
    this.cachedStorage = new CachedStorage(baseStorage, config.cache, config.batch)
    this.timestampCleaner = new LazyTimestampCleaner(this.cachedStorage, config.lazyCleanup)

    // Injecter le storage optimisé dans la stratégie (sans exposer any publiquement)
    ;(this.strategy as unknown as { storage: Storage }).storage = this.cachedStorage
  }

  async check(identifier: string): Promise<InferLimiterResult<S>> {
    const res = (await this.strategy.check(identifier)) as InferLimiterResult<S>
    const priority = (res as { allowed: boolean }).allowed ? 1 : 2
    this.timestampCleaner.scheduleCleanup(identifier, priority)
    return res
  }

  async checkBatch(identifiers: string[]): Promise<Array<InferLimiterResult<S>>> {
    if (this.strategy.checkBatch) {
      const out = await this.strategy.checkBatch(identifiers)
      return out as Array<InferLimiterResult<S>>
    }

    const results: Array<InferLimiterResult<S>> = []
    for (const id of identifiers) {
      const r = await this.check(id)
      results.push(r)
    }
    return results
  }

  getStats() {
    return {
      cache: this.cachedStorage.getCacheStats(),
      timestampCleaner: this.timestampCleaner.getStats(),
    }
  }

  stop(): void {
    this.cachedStorage.stop()
  }
}