import type { FixedWindowOptions, FixedWindowResult, Limiter } from '@ratelock/core'

type Entry = { count: number; reset: number }

export type FixedWindowLimiterConfig = FixedWindowOptions & {
  prefix?: string
}

export async function createFixedWindowLimiter(
  config: FixedWindowLimiterConfig,
): Promise<Limiter<FixedWindowResult>> {
  const { limit, windowMs, prefix = 'fw' } = config
  const state = new Map<string, Entry>()

  return {
    async check(id: string): Promise<FixedWindowResult> {
      const key = `${prefix}:${id}`
      const now = Date.now()
      const entry = state.get(key)

      if (!entry || now >= entry.reset) {
        state.set(key, { count: 1, reset: now + windowMs })
        return { allowed: true, remaining: limit - 1, reset: now + windowMs }
      }

      const allowed = entry.count < limit
      if (allowed) {
        entry.count++
        state.set(key, entry)
      }

      return {
        allowed,
        remaining: Math.max(0, limit - entry.count - (allowed ? 0 : 1)),
        reset: entry.reset,
      }
    },

    checkBatch(ids: string[]): Promise<FixedWindowResult[]> {
      return Promise.all(ids.map((id) => this.check(id)))
    },
  }
}
