'use client'

import type { RateLimitResult, RequestEvent } from '@/simulation/types'
import { useRefreshInterval } from '@/simulation/hooks/useRefreshInterval'
import { useMemo } from 'react'
import { UnifiedTimelineBase } from './shared'

type Props = {
    events: RequestEvent[]
    capacity: number
    refillRate: number
    refillTime: number
    now?: number
    lastResult?: RateLimitResult
    currentTokens?: number,
    isRunning: boolean
}

function formatMs(ms?: number) {
    if (!ms || ms <= 0) return '—'
    if (ms < 1000) return `${ms}ms`
    const s = Math.round(ms / 100) / 10
    return `${s}s`
}

export default function TokenBucketTimeline({
    events,
    capacity,
    refillRate,
    refillTime,
    now: nowProp,
    lastResult,
    isRunning,
}: Props) {
    useRefreshInterval(isRunning)
    const now = nowProp ?? Date.now()

    const timelineStart = now - capacity * 1000
    const timelineEnd = now + capacity * 1000
    const timelineSpan = timelineEnd - timelineStart

    const visibleEvents = useMemo(
        () => events.filter(e => e.timestamp >= timelineStart && e.timestamp <= timelineEnd),
        [events, timelineStart, timelineEnd]
    )

    const allowedCount = visibleEvents.filter(e => e.allowed).length
    const deniedCount = visibleEvents.length - allowedCount

    const calculateCurrentTokens = () => {
        let tokens = lastResult?.tokens ?? capacity
        
        if (lastResult && events.length > 0) {
            const lastEvent = events[events.length - 1]
            if (lastEvent) {
                const lastEventTime = lastEvent.timestamp
                const timeElapsed = now - lastEventTime
                
                const refillCycles = Math.floor(timeElapsed / refillTime)
                const refilledTokens = refillCycles * refillRate
                
                tokens = Math.min(capacity, tokens + refilledTokens)
            }
        }
        
        return Math.floor(tokens * 100) / 100
    }
    
    const currentTokens = calculateCurrentTokens()
    const tokenPercentage = Math.max(0, Math.min(100, (currentTokens / capacity) * 100))

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        Allowed
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                        Denied
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 bg-blue-200 border border-blue-400 inline-block rounded" />
                        Token Bucket
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span>
                        Capacity: <b>{capacity}</b> tokens
                    </span>
                    <span>
                        Current: <b>{Math.floor(currentTokens)}</b>
                    </span>
                    <span>
                        Refill: <b>{refillRate}</b> every {formatMs(refillTime)}
                    </span>
                </div>
            </div>

<div className="flex gap-4">
    <div className="w-12 flex-shrink-0 h-48 flex flex-col">
        <div className="relative flex-1 min-h-0">
                        <div className="absolute inset-0 bg-background rounded-lg border border-border border-dashed">
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-lg transition-all duration-500 ease-out"
                                style={{ height: `${tokenPercentage}%` }}
                            />
                        </div>

                        <div className="absolute -right-8 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground">
                            <span>{capacity}</span>
                            <span>{Math.floor(capacity * 0.75)}</span>
                            <span>{Math.floor(capacity * 0.5)}</span>
                            <span>{Math.floor(capacity * 0.25)}</span>
                            <span>0</span>
                        </div>

                        <div
                            className="absolute -left-8 text-xs font-medium text-blue-600"
                            style={{ bottom: `${tokenPercentage}%`, transform: 'translateY(50%)' }}>
                            {Math.floor(currentTokens)}
                        </div>
                        <div className="absolute top-4 left-0 right-0 text-xs text-center mb-2 font-medium text-shadow-2xs">Token Level</div>
                    </div>
                </div>


                <UnifiedTimelineBase
                    now={now}
                    timelineSpan={timelineSpan}
                    events={events}
                    nowMarkerLabel="now"
                    isRunning={isRunning}
            />
            </div>

            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-4">
                <span>
                    Total: <b>{visibleEvents.length}</b>
                </span>
                <span>
                    Allowed: <b className="text-emerald-600/50">{allowedCount}</b>
                </span>
                <span>
                    Denied: <b className="text-rose-600/50">{deniedCount}</b>
                </span>
                <span>
                    Tokens:{' '}
                    <b className="text-blue-600">
                        {Math.floor(currentTokens)}/{capacity}
                    </b>
                </span>
            </div>
        </div>
    )
}
