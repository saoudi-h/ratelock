'use client'
import { fixedWindowConfigAtom } from '@/simulation/store/atoms'
import { fixedWindowConfigSchema } from '@/simulation/types'
import { useAtom } from 'jotai'
import { useMemo } from 'react'
import { UnifiedControls, type ControlConfig } from './shared'

export default function FixedWindowControls() {
    const [config, setConfig] = useAtom(fixedWindowConfigAtom)

    const controls: ControlConfig[] = useMemo(() => {
        const setLimit = (limit: number) => {
            const result = fixedWindowConfigSchema.safeParse({
                ...config,
                limit,
            })

            if (result.success) {
                setConfig(result.data)
            }
        }

        const setWindowMs = (windowMs: number) => {
            const result = fixedWindowConfigSchema.safeParse({
                ...config,
                windowMs,
            })

            if (result.success) {
                setConfig(result.data)
            }
        }

        return [
            {
                id: 'fixed-limit',
                label: 'Limit',
                value: config.limit,
                onChange: setLimit,
                min: 1,
                max: 50,
            },
            {
                id: 'fixed-window-ms',
                label: 'Window',
                value: config.windowMs,
                onChange: setWindowMs,
                min: 1000,
                step: 200,
                suffix: 'ms',
            },
        ]
    }, [config, setConfig])

    return <UnifiedControls strategyName="Fixed Window" controls={controls} />
}
