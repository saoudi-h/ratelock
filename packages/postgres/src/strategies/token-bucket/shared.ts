export const TABLE = 'ratelock.token_bucket'

export function buildKey(prefix: string, id: string): string {
    return `${prefix}:${id}`
}

export function parseTokenRow(row: {
    tokens: number
    capacity: number
    refill_rate: number
    last_refill: number
    allowed: boolean | number
}): { tokens: number; rate: number; allowed: boolean } {
    return {
        tokens: Number(row.tokens),
        rate: Number(row.refill_rate),
        allowed: Boolean(row.allowed),
    }
}

export type TokenBucketCheckResult = {
    allowed: boolean
    remaining: number
    tokens: number
    refillTime: number
}

export function buildResult(
    tokens: number,
    rate: number,
    allowed: boolean
): TokenBucketCheckResult {
    if (allowed) {
        return {
            allowed: true,
            remaining: Math.floor(tokens),
            tokens: Math.floor(tokens),
            refillTime: 0,
        }
    }
    return {
        allowed: false,
        remaining: Math.floor(tokens),
        tokens: Math.floor(tokens),
        refillTime: Math.ceil(((1 - tokens) / rate) * 1000),
    }
}
