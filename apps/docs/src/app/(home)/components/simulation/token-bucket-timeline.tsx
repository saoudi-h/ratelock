'use client'

import { useMemo } from 'react'
import type { RequestEvent, TokenBucketConfig } from '@/simulation/types'
import { UnifiedTimelineBase } from './unified-timeline'
import { useNow } from './use-simulation'

interface TokenBucketTimelineProps {
    events: RequestEvent[]
    config: TokenBucketConfig
    lastResult?: { remaining: number; tokens: number; refillTime: number }
}

function formatMs(ms: number): string {
    if (ms <= 0) return '0ms'
    if (ms < 1000) return `${ms}ms`
    return `${Math.round(ms / 100) / 10}s`
}

export function TokenBucketTimeline({
    events,
    config,
    lastResult,
}: TokenBucketTimelineProps) {
    const now = useNow(80)
    const { capacity, refillRate } = config
    const timelineSpan = Math.max(2500, capacity * 900)

    const currentTokens = useMemo(() => {
        let tokens = lastResult?.tokens ?? capacity
        if (lastResult && events.length > 0) {
            const lastEvent = events[events.length - 1]
            if (lastEvent) {
                const timeElapsed = now - lastEvent.timestamp
                const refilled = timeElapsed * (refillRate / 1000)
                tokens = Math.min(capacity, tokens + refilled)
            }
        }
        return Math.max(0, Math.floor(tokens * 100) / 100)
    }, [events, now, lastResult, capacity, refillRate])

    const allowedCount = events.filter((e) => e.allowed).length
    const deniedCount = events.length - allowedCount
    const refillTimeMs = lastResult?.refillTime ? Math.max(0, lastResult.refillTime) : 0
    const tokenPercent = (currentTokens / capacity) * 100
    const radius = 28
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference * (1 - tokenPercent / 100)

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="
                      inline-flex items-center gap-1.5 rounded-full border
                      border-border/70 bg-card/80 px-2.5 py-1 text-sm
                      text-muted-foreground
                    ">
                        <span className="size-2.5 rounded-full bg-emerald-500" />
                        Allowed
                    </span>
                    <span className="
                      inline-flex items-center gap-1.5 rounded-full border
                      border-border/70 bg-card/80 px-2.5 py-1 text-sm
                      text-muted-foreground
                    ">
                        <span className="size-2.5 rounded-full bg-rose-500" />
                        Denied
                    </span>
                </div>
                <div className="
                  flex flex-wrap items-center gap-2 font-mono text-xs
                ">
                    <span className="
                      rounded-full border border-border/70 bg-card/80 px-2.5
                      py-1
                    ">
                        Capacity: <b>{capacity}</b>
                    </span>
                    <span className="
                      rounded-full border border-border/70 bg-card/80 px-2.5
                      py-1
                    ">
                        Refill: <b>{refillRate}</b>/s
                    </span>
                    <span className="
                      rounded-full border border-border/70 bg-card/80 px-2.5
                      py-1
                    ">
                        Next token: <b>{formatMs(refillTimeMs)}</b>
                    </span>
                </div>
            </div>

            <div className="
              grid items-stretch gap-4
              lg:grid-cols-[120px_minmax(0,1fr)]
            ">
                <div className="
                  flex h-[184px] items-center justify-center rounded-lg border
                  border-border bg-background
                ">
                    <div className="
                      relative flex size-24 items-center justify-center
                    ">
                        <svg className="size-24 -rotate-90" viewBox="0 0 72 72" aria-hidden="true">
                            <circle
                                cx="36"
                                cy="36"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="6"
                                className="text-muted/60"
                            />
                            <circle
                                cx="36"
                                cy="36"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="
                                  text-primary transition-[stroke-dashoffset]
                                  duration-150 ease-out
                                "
                            />
                        </svg>
                        <div className="
                          absolute inset-0 flex flex-col items-center
                          justify-center text-center
                        ">
                            <div className="
                              font-mono text-xl font-semibold tabular-nums
                            ">
                                {Math.floor(currentTokens)}
                            </div>
                            <div className="
                              text-[10px] tracking-[0.16em]
                              text-muted-foreground uppercase
                            ">
                                / {capacity}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="min-w-0">
                    <UnifiedTimelineBase events={events} timelineSpan={timelineSpan} />
                </div>
            </div>

            <div className="
              flex flex-wrap items-center gap-4 text-sm text-muted-foreground
            ">
                <span>
                    Tokens available:{' '}
                    <b className="text-primary">
                        {Math.floor(currentTokens)}/{capacity}
                    </b>
                </span>
                <span>
                    Allowed in history: <b className="text-emerald-600">{allowedCount}</b>
                </span>
                <span>
                    Denied in history: <b className="text-rose-600">{deniedCount}</b>
                </span>
            </div>
        </div>
    )
}
