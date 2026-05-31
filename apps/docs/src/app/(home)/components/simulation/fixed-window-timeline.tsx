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
}

export function FixedWindowTimeline({
    events,
    config,
    lastResult,
    startTime,
}: FixedWindowTimelineProps) {
    const now = useNow(100)
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
            startTime={startTime}>
            {/* Floating HUD Left */}
            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none z-30 select-none">
                <span
                    className="
                  inline-flex items-center gap-1.5 rounded-md border
                  border-border/40 bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium
                  text-muted-foreground shadow-2xs
                ">
                    <span className="size-1.5 rounded-full bg-blue-500" />
                    Total:{' '}
                    <span className="font-mono text-foreground font-bold">{events.length}</span>
                </span>
                <span
                    className="
                  inline-flex items-center gap-1.5 rounded-md border
                  border-border/40 bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium
                  text-emerald-500/90 shadow-2xs
                ">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Allowed:{' '}
                    <span className="font-mono text-foreground font-bold">{allowedCount}</span>
                </span>
                <span
                    className="
                  inline-flex items-center gap-1.5 rounded-md border
                  border-border/40 bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium
                  text-rose-500/90 shadow-2xs
                ">
                    <span className="size-1.5 rounded-full bg-rose-500" />
                    Denied:{' '}
                    <span className="font-mono text-foreground font-bold">{deniedCount}</span>
                </span>
            </div>

            {/* Floating HUD Right */}
            <div className="absolute top-3 right-3 flex flex-wrap items-center gap-1.5 pointer-events-none z-30 select-none">
                <span
                    className="
                  inline-flex items-center gap-1 rounded-md border border-border/40
                  bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-muted-foreground shadow-2xs
                ">
                    Limit: <span className="text-foreground font-bold">{limit}</span>
                </span>
                <span
                    className="
                  inline-flex items-center gap-1 rounded-md border border-border/40
                  bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-muted-foreground shadow-2xs
                ">
                    Remaining:{' '}
                    <span className="text-foreground font-bold tabular-nums">
                        {lastResult?.remaining ?? '-'}
                    </span>
                </span>
                <span
                    className="
                  inline-flex items-center gap-1 rounded-md border border-border/40
                  bg-background/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-muted-foreground shadow-2xs
                ">
                    Reset:{' '}
                    <span className="text-foreground font-bold tabular-nums">
                        {formatMs(resetRemaining)}
                    </span>
                </span>
            </div>
        </UnifiedTimelineBase>
    )
}
