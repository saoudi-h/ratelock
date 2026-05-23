'use client'

import { Slider } from '@/components/ui/slider'
import type { StrategySpecificConfig } from '@/simulation/types'
import { isTokenBucketConfig } from '@/simulation/types'

interface ConfigPanelProps {
    config: StrategySpecificConfig
    onConfigChange: (updates: Partial<StrategySpecificConfig>) => void
}

function getSliderValue(value: number | readonly number[]): number {
    if (Array.isArray(value)) {
        const first = value[0]
        return typeof first === 'number' ? first : 0
    }
    return value as number
}

export function ConfigPanel({ config, onConfigChange }: ConfigPanelProps) {
    if (isTokenBucketConfig(config)) {
        return (
            <div className="flex flex-col sm:flex-row items-center gap-6 w-full py-1 text-sm">
                <div className="flex-1 w-full space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-semibold uppercase tracking-wider text-[10px]">Capacity</span>
                        <span className="font-mono text-xs font-bold text-foreground bg-muted/65 border border-border/30 px-1.5 py-0.5 rounded-md">{config.capacity}</span>
                    </div>
                    <Slider
                        value={[config.capacity]}
                        onValueChange={(v) => onConfigChange({ capacity: getSliderValue(v) })}
                        min={1}
                        max={12}
                        step={1}
                        className="py-1"
                    />
                </div>

                <div className="flex-1 w-full space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-semibold uppercase tracking-wider text-[10px]">Refill rate</span>
                        <span className="font-mono text-xs font-bold text-foreground bg-muted/65 border border-border/30 px-1.5 py-0.5 rounded-md">{config.refillRate}/s</span>
                    </div>
                    <Slider
                        value={[config.refillRate]}
                        onValueChange={(v) => onConfigChange({ refillRate: getSliderValue(v) })}
                        min={1}
                        max={6}
                        step={1}
                        className="py-1"
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full py-1 text-sm">
            <div className="flex-1 w-full space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Limit</span>
                    <span className="font-mono text-xs font-bold text-foreground bg-muted/65 border border-border/30 px-1.5 py-0.5 rounded-md">{config.limit}</span>
                </div>
                <Slider
                    value={[config.limit]}
                    onValueChange={(v) => onConfigChange({ limit: getSliderValue(v) })}
                    min={1}
                    max={12}
                    step={1}
                    className="py-1"
                />
            </div>

            <div className="flex-1 w-full space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Window</span>
                    <span className="font-mono text-xs font-bold text-foreground bg-muted/65 border border-border/30 px-1.5 py-0.5 rounded-md">{(config.windowMs / 1000).toFixed(1)}s</span>
                </div>
                <Slider
                    value={[config.windowMs]}
                    onValueChange={(v) => onConfigChange({ windowMs: getSliderValue(v) })}
                    min={1000}
                    max={12_000}
                    step={500}
                    className="py-1"
                />
            </div>
        </div>
    )
}
