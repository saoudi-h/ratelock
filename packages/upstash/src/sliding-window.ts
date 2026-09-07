import type { Limiter, SlidingWindowOptions, SlidingWindowResult } from '@ratelock/core'
import { createSlidingWindow } from '@ratelock/redis-common'

import { createConnection } from './client'
import type { UpstashLimiterBaseConfig } from './types'

export type SlidingWindowLimiterConfig = SlidingWindowOptions & UpstashLimiterBaseConfig

export async function slidingWindow(
    config: SlidingWindowLimiterConfig
): Promise<Limiter<SlidingWindowResult>> {
    return createSlidingWindow(config, createConnection)
}
