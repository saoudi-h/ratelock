import type { FixedWindowResult, IndividualFixedWindowOptions, Limiter } from '@ratelock/core'

type Entry = { count: number; start: number }

export type IndividualFixedWindowLimiterConfig = IndividualFixedWindowOptions & {
  prefix?: string
  maxSize?: number
}

export async function createIndividualFixedWindowLimiter(
  config: IndividualFixedWindowLimiterConfig,
): Promise<Limiter<FixedWindowResult>> {
  const { limit, windowMs, prefix = 'ifw', maxSize = 100000 } = config
  const state = new Map<string, Entry>()
  let ops = 0

  const sweep = () => {
    const now = Date.now()
    let scanned = 0
    for (const [key, entry] of state) {
      if (now >= entry.start + windowMs) state.delete(key)
      if (++scanned >= 100) break
    }
  }

  const limiter: Limiter<FixedWindowResult> = {
    async check(id: string): Promise<FixedWindowResult> {
      const key = `${prefix}:${id}`
      const now = Date.now()
      let entry = state.get(key)

      if (!entry || now >= entry.start + windowMs) {
        entry = { count: 1, start: now }
        state.set(key, entry)
        if (++ops % 1000 === 0 && state.size > maxSize) sweep()
        return {
          allowed: true,
          remaining: limit - 1,
          reset: now + windowMs,
        }
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
      return Promise.all(ids.map((id) => limiter.check(id)))
    },
  }

  return limiter
}
