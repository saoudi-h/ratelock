'use client'

import SlidingWindowControls from '@/simulation/components/controls/SlidingWindowControls'
import SlidingWindowTimeline from '@/simulation/components/timelines/SlidingWindowTimeline'
import { useSlidingWindow } from '@/simulation/hooks/useSlidingWindow'
import { StrategyLayout } from './shared/StrategyLayout'

export function SlidingWindowStrategy() {
    const hookReturn = useSlidingWindow()

    return (
        <StrategyLayout
            title="Sliding Window"
            subTitle="Dynamic sliding time window rate limiting"
            description="In sliding window, the window moves continuously with time, smoothing the counting."
            autoRequests={hookReturn.autoRequests}
            autoRequestInterval={hookReturn.autoRequestInterval}
            sendManualRequest={hookReturn.sendManualRequest}
            toggleAutoRequests={hookReturn.toggleAutoRequests}
            setAutoRequestInterval={hookReturn.setAutoRequestInterval}
            isRunning={hookReturn.isRunning}
            startSimulation={hookReturn.startSimulation}
            stopSimulation={hookReturn.stopSimulation}
            resetSimulation={hookReturn.resetSimulation}
            controls={<SlidingWindowControls />}>
            <SlidingWindowTimeline
                events={hookReturn.events}
                now={hookReturn.now}
                lastResult={
                    hookReturn.events.length > 0
                        ? hookReturn.events[hookReturn.events.length - 1].result
                        : undefined
                }
                isRunning={hookReturn.isRunning}
            />
        </StrategyLayout>
    )
}
