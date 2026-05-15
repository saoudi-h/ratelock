import type { Limiter, SlidingWindowOptions, SlidingWindowResult } from '@ratelock/core'

export type SlidingWindowLimiterConfig = SlidingWindowOptions & {
  prefix?: string
}

export async function createSlidingWindowLimiter(
  config: SlidingWindowLimiterConfig,
): Promise<Limiter<SlidingWindowResult>> {
  const { limit, windowMs, prefix = 'sw' } = config
  const state = new Map<string, number[]>()

  return {
    async check(id: string): Promise<SlidingWindowResult> {
      const key = `${prefix}:${id}`
      const now = Date.now()
      const cutoff = now - windowMs

      let timestamps = state.get(key) ?? []
      timestamps = timestamps.filter((ts) => ts > cutoff)

      const allowed = timestamps.length < limit
      if (allowed) timestamps.push(now)

      state.set(key, timestamps)

      const oldest = timestamps.length > 0 ? Math.min(...timestamps) : now

      return {
        allowed,
        remaining: Math.max(0, limit - timestamps.length),
        reset: oldest + windowMs,
        windowStart: oldest,
        windowEnd: oldest + windowMs,
      }
    },

    checkBatch(ids: string[]): Promise<SlidingWindowResult[]> {
      return Promise.all(ids.map((id) => this.check(id)))
    },
  }
}
