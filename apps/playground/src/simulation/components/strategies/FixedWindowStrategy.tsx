'use client'

import FixedWindowControls from '@/simulation/components/controls/FixedWindowControls'
import FixedWindowTimeline from '@/simulation/components/timelines/FixedWindowTimeline'
import { useFixedWindow } from '@/simulation/hooks/useFixedWindow'
import { StrategyLayout } from './shared/StrategyLayout'

export function FixedWindowStrategy() {
    const hookReturn = useFixedWindow()

    return (
            <StrategyLayout
                title="Fixed Window"
                subTitle="Traditional fixed time window rate limiting"
                description="In fixed window, requests are counted in fixed time boxes. At reset, the box restarts."
                autoRequests={hookReturn.autoRequests}
                autoRequestInterval={hookReturn.autoRequestInterval}
                sendManualRequest={hookReturn.sendManualRequest}
                toggleAutoRequests={hookReturn.toggleAutoRequests}
                setAutoRequestInterval={hookReturn.setAutoRequestInterval}
                controls={<FixedWindowControls />}
                isRunning={hookReturn.isRunning}
                startSimulation={hookReturn.startSimulation}
                stopSimulation={hookReturn.stopSimulation}
                resetSimulation={hookReturn.resetSimulation}
                >
                <FixedWindowTimeline
                    events={hookReturn.events}
                    now={hookReturn.now}
                    simulationStartTime={hookReturn.simulationStartTime}
                    lastResult={hookReturn.events.length > 0 ? hookReturn.events[hookReturn.events.length - 1].result : undefined}
                    currentWindowStart={hookReturn.currentWindowStart}
                    isRunning={hookReturn.isRunning}
                    />
        </StrategyLayout>
    )
}
