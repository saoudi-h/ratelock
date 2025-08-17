'use client'

import { individualFixedWindowConfigAtom } from '@/simulation/store/atoms'
import { useAtom } from 'jotai'
import { useMemo } from 'react'
import { UnifiedControls, type ControlConfig } from './shared'
import { individualFixedWindowConfigSchema } from '@/simulation/types'

export default function IndividualFixedWindowControls() {
    const [config, setConfig] = useAtom(individualFixedWindowConfigAtom)

    const controls: ControlConfig[] = useMemo(() => {
        const setLimit = (limit: number) => {
            const result = individualFixedWindowConfigSchema.safeParse({
                ...config,
                limit
            })
            
            if (result.success) {
                setConfig(result.data)
            }
        }

        const setWindowMs = (windowMs: number) => {
            const result = individualFixedWindowConfigSchema.safeParse({
                ...config,
                windowMs
            })
            
            if (result.success) {
                setConfig(result.data)
            }
        }

        return [
            {
                id: 'individual-fixed-limit',
                label: 'Limit',
                value: config.limit,
                onChange: setLimit,
                min: 1,
                max: 50,
            },
            {
                id: 'individual-fixed-window-ms',
                label: 'Window',
                value: config.windowMs,
                onChange: setWindowMs,
                min: 1000,
                step: 200,
                suffix: 'ms',
            },
        ]
    }, [config, setConfig])

    return <UnifiedControls strategyName="Individual Fixed Window" controls={controls} />
}
