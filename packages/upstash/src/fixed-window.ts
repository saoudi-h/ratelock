import type { FixedWindowOptions, FixedWindowResult, Limiter } from '@ratelock/core'
import { createFixedWindow } from '@ratelock/redis-common'

import { createConnection } from './client'
import type { UpstashLimiterBaseConfig } from './types'

export type FixedWindowLimiterConfig = FixedWindowOptions & UpstashLimiterBaseConfig

export async function fixedWindow(
    config: FixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    return createFixedWindow(config, createConnection)
}
