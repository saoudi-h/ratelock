import type { BaseResult, ErrorPolicy, Limiter } from './types'

export function withErrorPolicy<T extends BaseResult>(
    limiter: Limiter<T>,
    policy: ErrorPolicy
): Limiter<T> {
    const handle = async (id: string): Promise<T> => {
        try {
            return await limiter.check(id)
        } catch {
            switch (policy) {
                case 'allow':
                    return { allowed: true } as T
                case 'deny':
                    return { allowed: false } as T
                case 'throw':
                default:
                    throw new Error(`Rate limit check failed for "${id}"`)
            }
        }
    }

    const handleBatch = async (ids: string[]): Promise<T[]> => {
        try {
            return await limiter.checkBatch(ids)
        } catch (err) {
            switch (policy) {
                case 'allow':
                    return ids.map(() => ({ allowed: true }) as T)
                case 'deny':
                    return ids.map(() => ({ allowed: false }) as T)
                case 'throw':
                default:
                    throw new Error(`Rate limit check failed for batch of "${ids.join(', ')}"`, { cause: err })
            }
        }
    }

    return { check: handle, checkBatch: handleBatch }
}
