import type { FixedWindowOptions, FixedWindowResult, Limiter } from '@ratelock/core'
import { createFixedWindow } from '@ratelock/redis-common'

import { createConnection } from './client'
import type { RedisLimiterBaseConfig } from './types'

export type FixedWindowLimiterConfig = FixedWindowOptions & RedisLimiterBaseConfig

export async function fixedWindow(
    config: FixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    return createFixedWindow(config, createConnection)
}
