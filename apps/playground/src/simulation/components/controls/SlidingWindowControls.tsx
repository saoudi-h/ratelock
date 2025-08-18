'use client'

import { slidingWindowConfigAtom } from '@/simulation/store/atoms'
import { slidingWindowConfigSchema } from '@/simulation/types'
import { useAtom } from 'jotai'
import { useMemo } from 'react'
import { UnifiedControls, type ControlConfig } from './shared'

export default function SlidingWindowControls() {
    const [config, setConfig] = useAtom(slidingWindowConfigAtom)

    const controls: ControlConfig[] = useMemo(() => {
        const setLimit = (limit: number) => {
            const result = slidingWindowConfigSchema.safeParse({
                ...config,
                limit,
            })

            if (result.success) {
                setConfig(result.data)
            }
        }

        const setWindowMs = (windowMs: number) => {
            const result = slidingWindowConfigSchema.safeParse({
                ...config,
                windowMs,
            })

            if (result.success) {
                setConfig(result.data)
            }
        }

        return [
            {
                id: 'sliding-limit',
                label: 'Limit',
                value: config.limit,
                onChange: setLimit,
                min: 1,
                max: 50,
            },
            {
                id: 'sliding-window-ms',
                label: 'Window',
                value: config.windowMs,
                onChange: setWindowMs,
                min: 1000,
                step: 200,
                suffix: 'ms',
            },
        ]
    }, [config, setConfig])

    return <UnifiedControls strategyName="Sliding Window" controls={controls} />
}
