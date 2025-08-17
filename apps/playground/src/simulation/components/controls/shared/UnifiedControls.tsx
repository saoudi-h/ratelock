'use client'

import { BaseControls } from '../BaseControls'
import { ControlField } from './ControlField'

export interface ControlConfig {
    id: string
    label: string
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    step?: number
    suffix?: string
    className?: string
}

interface UnifiedControlsProps {
    strategyName: string
    controls: ControlConfig[]
    className?: string
}

export function UnifiedControls({ strategyName, controls }: UnifiedControlsProps) {
    return (
        <BaseControls strategyName={strategyName}>
            {controls.map(control => {
                const props: any = {
                    key: control.id,
                    id: control.id,
                    label: control.label,
                    value: control.value,
                    onChange: control.onChange,
                }

                if (control.min !== undefined) props.min = control.min
                if (control.max !== undefined) props.max = control.max
                if (control.step !== undefined) props.step = control.step
                if (control.suffix !== undefined) props.suffix = control.suffix
                if (control.className !== undefined) props.className = control.className

                return <ControlField {...props} key={control.id} />
            })}
        </BaseControls>
    )
}
