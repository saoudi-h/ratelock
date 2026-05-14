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
        } catch {
            return ids.map(() => {
                switch (policy) {
                    case 'allow':
                        return { allowed: true } as T
                    case 'deny':
                        return { allowed: false } as T
                    case 'throw':
                    default:
                        return { allowed: false } as T
                }
            })
        }
    }

    return { check: handle, checkBatch: handleBatch }
}
