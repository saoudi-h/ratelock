import type { FixedWindowResult, IndividualFixedWindowOptions, Limiter } from '@ratelock/core'

type Entry = { count: number; start: number }

export type IndividualFixedWindowLimiterConfig = IndividualFixedWindowOptions & {
  prefix?: string
}

export async function createIndividualFixedWindowLimiter(
  config: IndividualFixedWindowLimiterConfig,
): Promise<Limiter<FixedWindowResult>> {
  const { limit, windowMs, prefix = 'ifw' } = config
  const state = new Map<string, Entry>()

  return {
    async check(id: string): Promise<FixedWindowResult> {
      const key = `${prefix}:${id}`
      const now = Date.now()
      let entry = state.get(key)

      if (!entry || now >= entry.start + windowMs) {
        entry = { count: 0, start: now }
        state.set(key, entry)
      }

      const allowed = entry.count < limit
      if (allowed) {
        entry.count++
        state.set(key, entry)
      }

      return {
        allowed,
        remaining: Math.max(0, limit - entry.count),
        reset: entry.start + windowMs,
      }
    },

    checkBatch(ids: string[]): Promise<FixedWindowResult[]> {
      return Promise.all(ids.map((id) => this.check(id)))
    },
  }
}
