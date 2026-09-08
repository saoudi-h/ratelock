import type { Limiter, TokenBucketOptions, TokenBucketResult } from '@ratelock/core'
import { createTokenBucket } from '@ratelock/redis-common'

import { createConnection } from './client'
import type { UpstashLimiterBaseConfig } from './types'

export type TokenBucketLimiterConfig = TokenBucketOptions & UpstashLimiterBaseConfig

export async function tokenBucket(
    config: TokenBucketLimiterConfig
): Promise<Limiter<TokenBucketResult>> {
    return createTokenBucket(config, createConnection)
}
