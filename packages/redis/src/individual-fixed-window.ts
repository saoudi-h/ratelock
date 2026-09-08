import type { FixedWindowResult, IndividualFixedWindowOptions, Limiter } from '@ratelock/core'
import { createIndividualFixedWindow } from '@ratelock/redis-common'

import { createConnection } from './client'
import type { RedisLimiterBaseConfig } from './types'

export type IndividualFixedWindowLimiterConfig = IndividualFixedWindowOptions &
    RedisLimiterBaseConfig

export async function individualFixedWindow(
    config: IndividualFixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    return createIndividualFixedWindow(config, createConnection)
}
