'use client'

import { useAtomValue, useSetAtom } from 'jotai'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Controls, ConfigPanel } from './controls'
import { FixedWindowTimeline } from './fixed-window-timeline'
import { SlidingWindowTimeline } from './sliding-window-timeline'
import { TokenBucketTimeline } from './token-bucket-timeline'
import { IndividualFixedWindowTimeline } from './individual-fixed-window-timeline'
import { useSimulation } from './use-simulation'
import { activeStrategyAtom, resetSimulationAtom, updateConfigAtom } from '@/simulation/atoms'
import {
    STRATEGY_LABELS,
    STRATEGY_DESCRIPTIONS,
    type StrategyId,
    isTokenBucketConfig,
    type FixedWindowConfig,
    type SlidingWindowConfig,
    type TokenBucketConfig,
    type IndividualFixedWindowConfig,
} from '@/simulation/types'

const STRATEGIES: StrategyId[] = [
    'fixed-window',
    'sliding-window',
    'token-bucket',
    'individual-fixed-window',
]

function MetricCard({
    label,
    value,
    tone,
}: {
    label: string
    value: number
    tone?: string
}) {
    return (
        <Card
            size="sm"
            className="
              gap-2 rounded-2xl border border-border/70 bg-card/70 py-4
              shadow-none ring-0
            "
        >
            <CardContent className="space-y-1">
                <div className="
                  text-[11px] tracking-[0.16em] text-muted-foreground uppercase
                ">
                    {label}
                </div>
                <div className={`
                  font-mono text-2xl font-semibold tabular-nums
                  ${tone ?? ''}
                `}>
                    {value}
                </div>
            </CardContent>
        </Card>
    )
}

function StrategyView({ strategyId }: { strategyId: StrategyId }) {
    const {
        events,
        autoRequests,
        setAutoRequests,
        autoInterval,
        setAutoInterval,
        sendRequest,
        config,
    } = useSimulation(strategyId)

    const resetSimulation = useSetAtom(resetSimulationAtom)
    const updateConfig = useSetAtom(updateConfigAtom)

    const lastEvent = events[events.length - 1]
    const remaining =
        lastEvent?.remaining ??
        (isTokenBucketConfig(config)
            ? (config as TokenBucketConfig).capacity
            : (config as FixedWindowConfig).limit)
    const allowedCount = events.filter((event) => event.allowed).length
    const deniedCount = events.length - allowedCount

    const handleReset = async () => {
        await resetSimulation(strategyId)
    }

    return (
        <div className="
          grid gap-6
          xl:grid-cols-[300px_minmax(0,1fr)]
        ">
            <Card
                size="sm"
                className="
                  gap-0 rounded-2xl border border-border/70 bg-card/80 py-0
                  shadow-none ring-0
                "
            >
                <CardHeader className="border-b border-border/70 py-5">
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>
                        Tune the request generator and strategy thresholds.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 py-5">
                    <Controls
                        onSendRequest={sendRequest}
                        onReset={handleReset}
                        autoRequests={autoRequests}
                        onToggleAutoRequests={() => setAutoRequests(!autoRequests)}
                        autoInterval={autoInterval}
                        onAutoIntervalChange={setAutoInterval}
                    />

                    <ConfigPanel
                        config={config}
                        onConfigChange={(updates) => updateConfig(strategyId, updates)}
                    />
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="
                  grid gap-3
                  sm:grid-cols-2
                  xl:grid-cols-4
                ">
                    <MetricCard label="Remaining" value={remaining} />
                    <MetricCard label="Allowed" value={allowedCount} tone="text-emerald-600" />
                    <MetricCard label="Denied" value={deniedCount} tone="text-rose-600" />
                    <MetricCard label="Events" value={events.length} />
                </div>

                <Card
                    size="sm"
                    className="
                      gap-0 rounded-2xl border border-border/70 bg-card/70 py-0
                      shadow-none ring-0
                    "
                >
                    <CardHeader className="border-b border-border/70 py-4">
                        <CardTitle>Visualization</CardTitle>
                        <CardDescription>
                            Live behavior of the strategy over time.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="py-5">
                        {strategyId === 'fixed-window' && (
                            <FixedWindowTimeline
                                events={events}
                                config={config as FixedWindowConfig}
                                lastResult={lastEvent?.result as { remaining: number; reset: number } | undefined}
                            />
                        )}

                        {strategyId === 'sliding-window' && (
                            <SlidingWindowTimeline
                                events={events}
                                config={config as SlidingWindowConfig}
                                lastResult={lastEvent?.result as { remaining: number; windowStart: number; windowEnd: number } | undefined}
                            />
                        )}

                        {strategyId === 'token-bucket' && (
                            <TokenBucketTimeline
                                events={events}
                                config={config as TokenBucketConfig}
                                lastResult={lastEvent?.result as { remaining: number; tokens: number; refillTime: number } | undefined}
                            />
                        )}

                        {strategyId === 'individual-fixed-window' && (
                            <IndividualFixedWindowTimeline
                                events={events}
                                config={config as IndividualFixedWindowConfig}
                                lastResult={lastEvent?.result as { remaining: number; reset: number } | undefined}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export function StrategyTabs() {
    const activeStrategy = useAtomValue(activeStrategyAtom)
    const setActiveStrategy = useSetAtom(activeStrategyAtom)

    return (
        <Tabs
            value={activeStrategy}
            onValueChange={(value) => setActiveStrategy(value as StrategyId)}
            className="gap-5"
        >
            <TabsList className="
              h-auto rounded-2xl border border-border/70 bg-muted/55 p-1
            ">
                {STRATEGIES.map((id) => (
                    <TabsTrigger key={id} value={id} className="
                      rounded-xl px-4 py-2 text-sm
                    ">
                        {STRATEGY_LABELS[id]}
                    </TabsTrigger>
                ))}
            </TabsList>

            {STRATEGIES.map((id) => (
                <TabsContent key={id} value={id} className="space-y-5">
                    <div className="max-w-2xl">
                        <h3 className="
                          font-heading text-2xl font-semibold tracking-tight
                        ">
                            {STRATEGY_LABELS[id]}
                        </h3>
                        <p className="mt-2 text-sm/6 text-muted-foreground">
                            {STRATEGY_DESCRIPTIONS[id]}
                        </p>
                    </div>

                    <StrategyView strategyId={id} />
                </TabsContent>
            ))}
        </Tabs>
    )
}
