'use client'

import { RotateCcw, Send, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import type { StrategySpecificConfig } from '@/simulation/types'
import { isTokenBucketConfig } from '@/simulation/types'

interface ControlsProps {
    onReset: () => void
    autoInterval: number
    onAutoIntervalChange: (value: number) => void
}

export function Controls({
    onReset,
    autoInterval,
    onAutoIntervalChange,
}: ControlsProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="
                  text-[10px] font-bold tracking-[0.16em] text-muted-foreground/80 uppercase
                ">
                    Simulation
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onReset} 
                    className="w-full gap-1.5 active:scale-[0.97] transition-transform duration-150 border-border/80 bg-background/45 hover:bg-muted/70 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
                >
                    <RotateCcw className="size-3.5" />
                    Reset simulation
                </Button>
            </div>

            <div className="space-y-4 pt-1 border-t border-border/40">
                <div className="w-full space-y-2">
                    <div className="
                      flex items-center justify-between text-xs
                      text-muted-foreground/95
                    ">
                        <span className="font-medium">Request interval</span>
                        <span className="font-mono font-semibold tabular-nums text-foreground">{(autoInterval / 1000).toFixed(1)}s</span>
                    </div>
                    <Slider
                        value={[autoInterval]}
                        onValueChange={(v) => onAutoIntervalChange(Array.isArray(v) ? v[0] ?? 200 : v)}
                        min={80}
                        max={2000}
                        step={20}
                        className="py-1.5"
                    />
                </div>
            </div>
        </div>
    )
}

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
            <div className="space-y-4 pt-1 border-t border-border/40">
                <div className="
                  text-[10px] font-bold tracking-[0.16em] text-muted-foreground/80 uppercase
                ">
                    Parameters
                </div>
                <div className="space-y-4">
                    <div className="w-full space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground/95">
                            <span className="font-medium">Capacity</span>
                            <span className="font-mono text-xs font-semibold text-foreground bg-muted/65 border border-border/30 px-1.5 py-0.5 rounded-md">{config.capacity}</span>
                        </div>
                        <Slider
                            value={[config.capacity]}
                            onValueChange={(v) => onConfigChange({ capacity: getSliderValue(v) })}
                            min={1}
                            max={12}
                            step={1}
                            className="py-1.5"
                        />
                    </div>

                    <div className="w-full space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground/95">
                            <span className="font-medium">Refill rate</span>
                            <span className="font-mono text-xs font-semibold text-foreground bg-muted/65 border border-border/30 px-1.5 py-0.5 rounded-md">{config.refillRate}/s</span>
                        </div>
                        <Slider
                            value={[config.refillRate]}
                            onValueChange={(v) => onConfigChange({ refillRate: getSliderValue(v) })}
                            min={1}
                            max={6}
                            step={1}
                            className="py-1.5"
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 pt-1 border-t border-border/40">
            <div className="
              text-[10px] font-bold tracking-[0.16em] text-muted-foreground/80 uppercase
            ">
                Parameters
            </div>
            <div className="space-y-4">
                <div className="w-full space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground/95">
                        <span className="font-medium">Limit</span>
                        <span className="font-mono text-xs font-semibold text-foreground bg-muted/65 border border-border/30 px-1.5 py-0.5 rounded-md">{config.limit}</span>
                    </div>
                    <Slider
                        value={[config.limit]}
                        onValueChange={(v) => onConfigChange({ limit: getSliderValue(v) })}
                        min={1}
                        max={12}
                        step={1}
                        className="py-1.5"
                    />
                </div>

                <div className="w-full space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground/95">
                        <span className="font-medium">Window</span>
                        <span className="font-mono text-xs font-semibold text-foreground bg-muted/65 border border-border/30 px-1.5 py-0.5 rounded-md">{(config.windowMs / 1000).toFixed(1)}s</span>
                    </div>
                    <Slider
                        value={[config.windowMs]}
                        onValueChange={(v) => onConfigChange({ windowMs: getSliderValue(v) })}
                        min={1000}
                        max={12_000}
                        step={500}
                        className="py-1.5"
                    />
                </div>
            </div>
        </div>
    )
}
