import { checkRateLimit, checkRateLimitBatch } from '@/simulation/server/limiter'
import type { StorageConfig, StrategyConfig } from '@/simulation/types'
import { enrichStorageConfig, validateStorageConfig, validateStrategyConfig } from '@/simulation/types/validation'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { strategy, storage: storageConfig, userId, identifiers } = body as {
            strategy: StrategyConfig
            storage: StorageConfig
            userId?: string
            identifiers?: string[]
        }


        const storage = enrichStorageConfig(storageConfig)

        const sVal = validateStrategyConfig(strategy)
        if (!sVal.isValid) {
            return NextResponse.json({ error: sVal.errors }, { status: 400 })
        }
        const stVal = validateStorageConfig(storage)
        if (!stVal.isValid) {
            return NextResponse.json({ error: stVal.errors }, { status: 400 })
        }

        let data
        if (Array.isArray(identifiers) && identifiers.length > 0) {
            data = await checkRateLimitBatch(identifiers, strategy, storage)
        } else if (typeof userId === 'string' && userId) {
            data = await checkRateLimit(userId, strategy, storage)
        } else {
            return NextResponse.json({ error: 'Provide userId or identifiers[]' }, { status: 400 })
        }

        return NextResponse.json({
            data,
            meta: {
                strategyType: strategy.type,
                storageType: storage.type,
                timestamp: Date.now(),
            },
        })
    } catch (err: any) {
        console.error('RateLimit POST error', err)
        return NextResponse.json(
            { error: err?.message ?? 'Internal Server Error' },
            { status: 500 }
        )
    }
}
