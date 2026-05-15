import type { Limiter, SlidingWindowOptions, SlidingWindowResult } from '@ratelock/core'

export type SlidingWindowLimiterConfig = SlidingWindowOptions & {
  prefix?: string
  maxSize?: number
}

export async function createSlidingWindowLimiter(
  config: SlidingWindowLimiterConfig,
): Promise<Limiter<SlidingWindowResult>> {
  const { limit, windowMs, prefix = 'sw', maxSize = 100000 } = config
  const state = new Map<string, number[]>()
  let ops = 0

  const sweep = () => {
    const cutoff = Date.now() - windowMs
    let scanned = 0
    for (const [key, timestamps] of state) {
      const filtered = timestamps.filter((ts) => ts > cutoff)
      if (filtered.length === 0) state.delete(key)
      else state.set(key, filtered)
      if (++scanned >= 100) break
    }
  }

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

      if (++ops % 1000 === 0 && state.size > maxSize) sweep()

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
