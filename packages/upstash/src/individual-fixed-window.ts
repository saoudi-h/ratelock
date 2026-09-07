import type { FixedWindowResult, IndividualFixedWindowOptions, Limiter } from '@ratelock/core'
import { createIndividualFixedWindow } from '@ratelock/redis-common'

import { createConnection } from './client'
import type { UpstashLimiterBaseConfig } from './types'

export type IndividualFixedWindowLimiterConfig = IndividualFixedWindowOptions &
    UpstashLimiterBaseConfig

export async function individualFixedWindow(
    config: IndividualFixedWindowLimiterConfig
): Promise<Limiter<FixedWindowResult>> {
    return createIndividualFixedWindow(config, createConnection)
}
