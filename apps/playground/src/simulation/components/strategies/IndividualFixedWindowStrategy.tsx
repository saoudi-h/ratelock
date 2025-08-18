'use client'

import IndividualFixedWindowControls from '@/simulation/components/controls/IndividualFixedWindowControls'
import IndividualFixedWindowTimeline from '@/simulation/components/timelines/IndividualFixedWindowTimeline'
import { useIndividualFixedWindow } from '@/simulation/hooks/useIndividualFixedWindow'
import { StrategyLayout } from './shared/StrategyLayout'

export function IndividualFixedWindowStrategy() {
    const hookReturn = useIndividualFixedWindow()

    return (
        <StrategyLayout
            title="Individual Fixed Window"
            subTitle="Per-user fixed time window rate limiting"
            description="In individual fixed window, each user has their own window that starts from their first request. This prevents synchronized bursts across users."
            autoRequests={hookReturn.autoRequests}
            autoRequestInterval={hookReturn.autoRequestInterval}
            sendManualRequest={hookReturn.sendManualRequest}
            toggleAutoRequests={hookReturn.toggleAutoRequests}
            setAutoRequestInterval={hookReturn.setAutoRequestInterval}
            controls={<IndividualFixedWindowControls />}
            isRunning={hookReturn.isRunning}
            startSimulation={hookReturn.startSimulation}
            stopSimulation={hookReturn.stopSimulation}
            resetSimulation={hookReturn.resetSimulation}>
            <IndividualFixedWindowTimeline
                events={hookReturn.events}
                now={hookReturn.now}
                windows={hookReturn.windows}
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
