'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { activeStrategyAtom } from '@/simulation/atoms'
import { STRATEGY_DESCRIPTIONS, STRATEGY_LABELS, type StrategyId } from '@/simulation/types'
import { useAtomValue, useSetAtom } from 'jotai'
import { StrategyView } from './strategy-view'

const STRATEGIES: StrategyId[] = [
    'fixed-window',
    'sliding-window',
    'token-bucket',
    'individual-fixed-window',
]

export function StrategyTabs() {
    const activeStrategy = useAtomValue(activeStrategyAtom)
    const setActiveStrategy = useSetAtom(activeStrategyAtom)

    return (
        <Tabs
            value={activeStrategy}
            onValueChange={value => setActiveStrategy(value as StrategyId)}
            className="gap-5">
            <TabsList
                className="
              h-auto rounded-2xl border border-border/70 bg-muted/55 p-1
            ">
                {STRATEGIES.map(id => (
                    <TabsTrigger
                        key={id}
                        value={id}
                        className="
                      rounded-xl px-4 py-2 text-sm
                    ">
                        {STRATEGY_LABELS[id]}
                    </TabsTrigger>
                ))}
            </TabsList>

            {STRATEGIES.map(id => (
                <TabsContent key={id} value={id} className="space-y-5">
                    <div className="max-w-2xl">
                        <h3
                            className="
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
