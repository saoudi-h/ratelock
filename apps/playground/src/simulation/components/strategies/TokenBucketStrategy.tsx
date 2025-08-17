'use client'

import TokenBucketControls from '@/simulation/components/controls/TokenBucketControls'
import TokenBucketTimeline from '@/simulation/components/timelines/TokenBucketTimeline'
import { useTokenBucket } from '@/simulation/hooks/useTokenBucket'
import { StrategyLayout } from './shared/StrategyLayout'

export function TokenBucketStrategy() {
    const hookReturn = useTokenBucket()

    return (
            <StrategyLayout
            title="Token Bucket"
            subTitle="Token-based rate limiting with burst capacity"
            description="In token bucket, tokens are added at a fixed rate. Each request consumes a token. When the bucket is empty, requests are denied."
            autoRequests={hookReturn.autoRequests}
            autoRequestInterval={hookReturn.autoRequestInterval}
            sendManualRequest={hookReturn.sendManualRequest}
            toggleAutoRequests={hookReturn.toggleAutoRequests}
            setAutoRequestInterval={hookReturn.setAutoRequestInterval}
            isRunning={hookReturn.isRunning}
            startSimulation={hookReturn.startSimulation}
            stopSimulation={hookReturn.stopSimulation}
            resetSimulation={hookReturn.resetSimulation}
            controls={<TokenBucketControls />}>
            <TokenBucketTimeline
                events={hookReturn.events}
                capacity={hookReturn.config.capacity}
                refillRate={hookReturn.config.refillRate}
                refillTime={hookReturn.config.refillTime}
                now={hookReturn.now}
                currentTokens={hookReturn.currentTokens}
                isRunning={hookReturn.isRunning}
            lastResult={hookReturn.events.length > 0 ? hookReturn.events[hookReturn.events.length - 1].result : undefined}
        />
        </StrategyLayout>
    )
}
