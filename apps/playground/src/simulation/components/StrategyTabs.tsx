'use client'
import {
    FixedWindowStrategy,
    IndividualFixedWindowStrategy,
    SlidingWindowStrategy,
    TokenBucketStrategy,
} from '@/simulation/components/strategies'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { RateLimitStrategy } from '@/simulation/types'
import { Cart5, Repeat, SliderVertical, User } from '@solar-icons/react-perf/BoldDuotone'
import type { Icon } from '@solar-icons/react-perf/lib/types'
import React from 'react'
import { Section } from '../../components/blocks/Section'

export const StrategyTabs = () => {
    const TABS: {
        key: RateLimitStrategy
        label: string
        hint: string
        icon: Icon
        Strategy: () => React.JSX.Element
        default?: boolean
    }[] = [
        {
            key: 'fixed-window',
            label: 'Fixed Window',
            hint: 'Fixed windows that reset periodically',
            icon: Repeat,
            Strategy: FixedWindowStrategy,
            default: true,
        },
        {
            key: 'sliding-window',
            label: 'Sliding Window',
            hint: 'Sliding window based on the clock',
            icon: SliderVertical,
            Strategy: SlidingWindowStrategy,
        },
        {
            key: 'token-bucket',
            label: 'Token Bucket',
            hint: 'Requests consume tokens, regular refill',
            icon: Cart5,
            Strategy: TokenBucketStrategy,
        },
        {
            key: 'individual-fixed-window',
            label: 'Individual Fixed Window',
            hint: 'Per-user window, starts at first request',
            icon: User,
            Strategy: IndividualFixedWindowStrategy,
        },
    ]

    return (
        <Section className="py-12">
            <Tabs defaultValue={TABS.find(tab => tab.default)?.key ?? 'fixed-window'}>
                <TabsList className="w-full h-12 bg-background">
                    {TABS.map(tab => (
                        <TabsTrigger key={tab.key} value={tab.key} className="border-dashed">
                            <div className="flex items-center gap-2 md:gap-4 justify-between">
                                {<tab.icon size={32} />} {tab.label}
                            </div>
                        </TabsTrigger>
                    ))}
                </TabsList>
                {TABS.map(tab => (
                    <TabsContent key={tab.key} value={tab.key}>
                            <tab.Strategy />
                    </TabsContent>
                ))}
            </Tabs>
        </Section>
    )
}
