'use client'

import type { FixedWindowConfig, RequestEvent } from '@/simulation/types'
import { useMemo } from 'react'
import { UnifiedTimelineBase, type TimelineWindow } from './unified-timeline'
import { useNow } from './use-simulation'

function formatMs(ms: number): string {
    if (ms <= 0) return '0ms'
    if (ms < 1000) return `${ms}ms`
    return `${Math.round(ms / 100) / 10}s`
}

interface FixedWindowTimelineProps {
    events: RequestEvent[]
    config: FixedWindowConfig
    lastResult?: { remaining: number; reset: number }
    startTime: number
    isPlaying: boolean
}

export function FixedWindowTimeline({
    events,
    config,
    lastResult,
    startTime,
    isPlaying,
}: FixedWindowTimelineProps) {
    const now = useNow(100, isPlaying)
    const { windowMs, limit } = config
    const timelineSpan = windowMs * 3

    const windows = useMemo((): TimelineWindow[] => {
        const baseTime = now - (now % windowMs)

        const result: TimelineWindow[] = []
        for (let i = -2; i <= 2; i++) {
            const windowStart = baseTime + i * windowMs
            const windowEnd = windowStart + windowMs
            const windowEvents = events.filter(
                e => e.timestamp >= windowStart && e.timestamp < windowEnd
            )

            const isCurrent = windowStart <= now && now < windowEnd
            const isPast = windowEnd <= now
            const isFuture = windowStart > now

            result.push({
                id: `window-${windowStart}`,
                start: windowStart,
                end: windowEnd,
                isCurrent,
                isPast,
                isFuture,
                eventCount: windowEvents.length,
                limit,
                label: isCurrent ? 'Current' : isPast ? 'Past' : 'Future',
            })
        }
        return result
    }, [now, windowMs, limit, events])

    const allowedCount = events.filter(e => e.allowed).length
    const deniedCount = events.length - allowedCount
    const resetRemaining = lastResult?.reset ? Math.max(0, lastResult.reset - now) : 0

    return (
        <UnifiedTimelineBase
            events={events}
            timelineSpan={timelineSpan}
            windows={windows}
            startTime={startTime}
            isPlaying={isPlaying}>
            {/* Floating HUD Left */}
            <div className="
              pointer-events-none absolute top-3 left-3 z-30 flex flex-wrap
              items-center gap-1.5 select-none
            ">
                <span
                    className="
                      inline-flex items-center gap-1.5 rounded-md border
                      border-border/40 bg-background/60 px-2 py-0.5 text-[10px]
                      font-medium text-muted-foreground shadow-2xs
                      backdrop-blur-md
                    ">
                    <span className="size-1.5 rounded-full bg-blue-500" />
                    Total:{' '}
                    <span className="font-mono font-bold text-foreground">{events.length}</span>
                </span>
                <span
                    className="
                      inline-flex items-center gap-1.5 rounded-md border
                      border-border/40 bg-background/60 px-2 py-0.5 text-[10px]
                      font-medium text-emerald-500/90 shadow-2xs
                      backdrop-blur-md
                    ">
                    <span className="
                      size-1.5 animate-pulse rounded-full bg-emerald-500
                    " />
                    Allowed:{' '}
                    <span className="font-mono font-bold text-foreground">{allowedCount}</span>
                </span>
                <span
                    className="
                      inline-flex items-center gap-1.5 rounded-md border
                      border-border/40 bg-background/60 px-2 py-0.5 text-[10px]
                      font-medium text-rose-500/90 shadow-2xs backdrop-blur-md
                    ">
                    <span className="size-1.5 rounded-full bg-rose-500" />
                    Denied:{' '}
                    <span className="font-mono font-bold text-foreground">{deniedCount}</span>
                </span>
            </div>

            {/* Floating HUD Right */}
            <div className="
              pointer-events-none absolute top-3 right-3 z-30 flex flex-wrap
              items-center gap-1.5 select-none
            ">
                <span
                    className="
                      inline-flex items-center gap-1 rounded-md border
                      border-border/40 bg-background/60 px-2 py-0.5 font-mono
                      text-[10px] text-muted-foreground shadow-2xs
                      backdrop-blur-md
                    ">
                    Limit: <span className="font-bold text-foreground">{limit}</span>
                </span>
                <span
                    className="
                      inline-flex items-center gap-1 rounded-md border
                      border-border/40 bg-background/60 px-2 py-0.5 font-mono
                      text-[10px] text-muted-foreground shadow-2xs
                      backdrop-blur-md
                    ">
                    Remaining:{' '}
                    <span className="font-bold text-foreground tabular-nums">
                        {lastResult?.remaining ?? '-'}
                    </span>
                </span>
                <span
                    className="
                      inline-flex items-center gap-1 rounded-md border
                      border-border/40 bg-background/60 px-2 py-0.5 font-mono
                      text-[10px] text-muted-foreground shadow-2xs
                      backdrop-blur-md
                    ">
                    Reset:{' '}
                    <span className="font-bold text-foreground tabular-nums">
                        {formatMs(resetRemaining)}
                    </span>
                </span>
            </div>
        </UnifiedTimelineBase>
    )
}
