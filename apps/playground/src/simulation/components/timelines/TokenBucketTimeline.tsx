'use client'

import { useRefreshInterval } from '@/simulation/hooks/useRefreshInterval'
import type { RateLimitResult, RequestEvent } from '@/simulation/types'
import { useMemo, useState } from 'react'
import { UnifiedTimelineBase } from './shared'

type Props = {
    events: RequestEvent[]
    capacity: number
    refillRate: number
    refillTime: number
    now?: number
    lastResult?: RateLimitResult
    currentTokens?: number
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

    // Use provided now prop, or compute once: 0 for SSR, Date.now() for client
    const [nowFallback] = useState(() =>
        nowProp !== undefined || typeof window === 'undefined' ? 0 : Date.now()
    )

    const now = nowProp ?? nowFallback

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
            <div
                className="
                  mb-2 flex items-center justify-between text-sm
                  text-muted-foreground
                ">
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                        <span
                            className="
                              inline-block size-2.5 rounded-full bg-emerald-500
                            "
                        />
                        Allowed
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span
                            className="
                              inline-block size-2.5 rounded-full bg-rose-500
                            "
                        />
                        Denied
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span
                            className="
                              inline-block size-3 rounded-sm border
                              border-blue-400 bg-blue-200
                            "
                        />
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
                <div className="flex h-48 w-12 shrink-0 flex-col">
                    <div className="relative min-h-0 flex-1">
                        <div
                            className="
                              absolute inset-0 rounded-lg border border-dashed
                              border-border bg-background
                            ">
                            <div
                                className="
                                  absolute inset-x-0 bottom-0 rounded-lg
                                  bg-blue-500 transition-all duration-500
                                  ease-out
                                "
                                style={{ height: `${tokenPercentage}%` }}
                            />
                        </div>

                        <div
                            className="
                              absolute inset-y-0 -right-8 flex flex-col
                              justify-between text-xs text-muted-foreground
                            ">
                            <span>{capacity}</span>
                            <span>{Math.floor(capacity * 0.75)}</span>
                            <span>{Math.floor(capacity * 0.5)}</span>
                            <span>{Math.floor(capacity * 0.25)}</span>
                            <span>0</span>
                        </div>

                        <div
                            className="
                              absolute -left-8 text-xs font-medium text-blue-600
                            "
                            style={{ bottom: `${tokenPercentage}%`, transform: 'translateY(50%)' }}>
                            {Math.floor(currentTokens)}
                        </div>
                        <div
                            className="
                              absolute inset-x-0 top-4 mb-2 text-center text-xs
                              font-medium text-shadow-2xs
                            ">
                            Token Level
                        </div>
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

            <div
                className="
                  mt-2 flex items-center gap-4 text-sm text-muted-foreground
                ">
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
