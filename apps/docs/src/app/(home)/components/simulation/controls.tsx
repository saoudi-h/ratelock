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
            <div className="
              flex w-full flex-col items-center gap-6 py-1 text-sm
              sm:flex-row
            ">
                <div className="w-full flex-1 space-y-1.5">
                    <div className="
                      flex items-center justify-between text-xs
                      text-muted-foreground
                    ">
                        <span className="
                          text-[10px] font-semibold tracking-wider uppercase
                        ">
                            Capacity
                        </span>
                        <span className="
                          rounded-md border border-border/30 bg-muted/65 px-1.5
                          py-0.5 font-mono text-xs font-bold text-foreground
                        ">
                            {config.capacity}
                        </span>
                    </div>
                    <Slider
                        value={[config.capacity]}
                        onValueChange={v => onConfigChange({ capacity: getSliderValue(v) })}
                        min={1}
                        max={12}
                        step={1}
                        className="py-1"
                    />
                </div>

                <div className="w-full flex-1 space-y-1.5">
                    <div className="
                      flex items-center justify-between text-xs
                      text-muted-foreground
                    ">
                        <span className="
                          text-[10px] font-semibold tracking-wider uppercase
                        ">
                            Refill rate
                        </span>
                        <span className="
                          rounded-md border border-border/30 bg-muted/65 px-1.5
                          py-0.5 font-mono text-xs font-bold text-foreground
                        ">
                            {config.refillRate}/s
                        </span>
                    </div>
                    <Slider
                        value={[config.refillRate]}
                        onValueChange={v => onConfigChange({ refillRate: getSliderValue(v) })}
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
        <div className="
          flex w-full flex-col items-center gap-6 py-1 text-sm
          sm:flex-row
        ">
            <div className="w-full flex-1 space-y-1.5">
                <div className="
                  flex items-center justify-between text-xs
                  text-muted-foreground
                ">
                    <span className="
                      text-[10px] font-semibold tracking-wider uppercase
                    ">
                        Limit
                    </span>
                    <span className="
                      rounded-md border border-border/30 bg-muted/65 px-1.5
                      py-0.5 font-mono text-xs font-bold text-foreground
                    ">
                        {config.limit}
                    </span>
                </div>
                <Slider
                    value={[config.limit]}
                    onValueChange={v => onConfigChange({ limit: getSliderValue(v) })}
                    min={1}
                    max={12}
                    step={1}
                    className="py-1"
                />
            </div>

            <div className="w-full flex-1 space-y-1.5">
                <div className="
                  flex items-center justify-between text-xs
                  text-muted-foreground
                ">
                    <span className="
                      text-[10px] font-semibold tracking-wider uppercase
                    ">
                        Window
                    </span>
                    <span className="
                      rounded-md border border-border/30 bg-muted/65 px-1.5
                      py-0.5 font-mono text-xs font-bold text-foreground
                    ">
                        {(config.windowMs / 1000).toFixed(1)}s
                    </span>
                </div>
                <Slider
                    value={[config.windowMs]}
                    onValueChange={v => onConfigChange({ windowMs: getSliderValue(v) })}
                    min={1000}
                    max={12_000}
                    step={500}
                    className="py-1"
                />
            </div>
        </div>
    )
}
