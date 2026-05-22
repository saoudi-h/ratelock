'use client'

import { RotateCcw, Send, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import type { StrategySpecificConfig } from '@/simulation/types'
import { isTokenBucketConfig } from '@/simulation/types'

interface ControlsProps {
    onSendRequest: () => void
    onReset: () => void
    autoRequests: boolean
    onToggleAutoRequests: () => void
    autoInterval: number
    onAutoIntervalChange: (value: number) => void
}

export function Controls({
    onSendRequest,
    onReset,
    autoRequests,
    onToggleAutoRequests,
    autoInterval,
    onAutoIntervalChange,
}: ControlsProps) {
    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <div className="
                  text-[11px] tracking-[0.16em] text-muted-foreground uppercase
                ">
                    Simulation
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={onSendRequest} className="
                      gap-1.5
                    ">
                        <Send className="size-3.5" />
                        Send request
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onReset} className="
                      gap-1.5
                    ">
                        <RotateCcw className="size-3.5" />
                        Reset
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                    <Zap className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Auto requests</span>
                    <Switch checked={autoRequests} onCheckedChange={onToggleAutoRequests} />
                </div>

                <div className="max-w-[240px] space-y-1.5">
                    <div className="
                      flex items-center justify-between text-xs
                      text-muted-foreground
                    ">
                        <span>Request interval</span>
                        <span className="font-mono tabular-nums">{(autoInterval / 1000).toFixed(1)}s</span>
                    </div>
                    <Slider
                        value={[autoInterval]}
                        onValueChange={(v) => onAutoIntervalChange(Array.isArray(v) ? v[0] ?? 200 : v)}
                        min={80}
                        max={2000}
                        step={20}
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
            <div className="space-y-5">
                <div className="
                  text-[11px] tracking-[0.16em] text-muted-foreground uppercase
                ">
                    Parameters
                </div>
                <div className="space-y-4">
                    <div className="max-w-[240px] space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Capacity</span>
                            <span className="font-mono text-sm">{config.capacity}</span>
                        </div>
                        <Slider
                            value={[config.capacity]}
                            onValueChange={(v) => onConfigChange({ capacity: getSliderValue(v) })}
                            min={1}
                            max={12}
                            step={1}
                        />
                    </div>

                    <div className="max-w-[240px] space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Refill rate</span>
                            <span className="font-mono text-sm">{config.refillRate}/s</span>
                        </div>
                        <Slider
                            value={[config.refillRate]}
                            onValueChange={(v) => onConfigChange({ refillRate: getSliderValue(v) })}
                            min={1}
                            max={6}
                            step={1}
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            <div className="
              text-[11px] tracking-[0.16em] text-muted-foreground uppercase
            ">
                Parameters
            </div>
            <div className="space-y-4">
                <div className="max-w-[240px] space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Limit</span>
                        <span className="font-mono text-sm">{config.limit}</span>
                    </div>
                    <Slider
                        value={[config.limit]}
                        onValueChange={(v) => onConfigChange({ limit: getSliderValue(v) })}
                        min={1}
                        max={12}
                        step={1}
                    />
                </div>

                <div className="max-w-[240px] space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Window</span>
                        <span className="font-mono text-sm">{(config.windowMs / 1000).toFixed(1)}s</span>
                    </div>
                    <Slider
                        value={[config.windowMs]}
                        onValueChange={(v) => onConfigChange({ windowMs: getSliderValue(v) })}
                        min={1000}
                        max={12_000}
                        step={500}
                    />
                </div>
            </div>
        </div>
    )
}
