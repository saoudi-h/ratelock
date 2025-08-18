'use client'

import { tokenBucketConfigAtom } from '@/simulation/store/atoms'
import { tokenBucketConfigSchema } from '@/simulation/types'
import { useAtom } from 'jotai'
import { useMemo } from 'react'
import { UnifiedControls, type ControlConfig } from './shared'

export default function TokenBucketControls() {
    const [config, setConfig] = useAtom(tokenBucketConfigAtom)

    const controls: ControlConfig[] = useMemo(() => {
        const setCapacity = (capacity: number) => {
            const result = tokenBucketConfigSchema.safeParse({
                ...config,
                capacity,
            })

            if (result.success) {
                setConfig(result.data)
            }
        }

        const setRefillRate = (refillRate: number) => {
            const result = tokenBucketConfigSchema.safeParse({
                ...config,
                refillRate,
            })

            if (result.success) {
                setConfig(result.data)
            }
        }

        const setRefillTime = (refillTime: number) => {
            const result = tokenBucketConfigSchema.safeParse({
                ...config,
                refillTime,
            })

            if (result.success) {
                setConfig(result.data)
            }
        }

        return [
            {
                id: 'token-bucket-capacity',
                label: 'Capacity',
                value: config.capacity,
                onChange: setCapacity,
                min: 1,
                max: 50,
            },
            {
                id: 'token-bucket-refill-rate',
                label: 'Refill Rate',
                value: config.refillRate,
                onChange: setRefillRate,
                min: 1,
                max: 50,
            },
            {
                id: 'token-bucket-refill-time',
                label: 'Refill Time',
                value: config.refillTime,
                onChange: setRefillTime,
                min: 1000,
                step: 200,
                suffix: 'ms',
            },
        ]
    }, [config, setConfig])

    return <UnifiedControls strategyName="Token Bucket" controls={controls} />
}
