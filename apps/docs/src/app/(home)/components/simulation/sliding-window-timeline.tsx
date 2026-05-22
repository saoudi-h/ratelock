'use client'

import { useMemo } from 'react'
import type { RequestEvent, SlidingWindowConfig } from '@/simulation/types'
import { UnifiedTimelineBase, type TimelineWindow } from './unified-timeline'
import { useNow } from './use-simulation'

function formatMs(ms: number): string {
    if (ms <= 0) return '0ms'
    if (ms < 1000) return `${ms}ms`
    return `${Math.round(ms / 100) / 10}s`
}

interface SlidingWindowTimelineProps {
    events: RequestEvent[]
    config: SlidingWindowConfig
    lastResult?: { remaining: number; windowStart: number; windowEnd: number }
}

export function SlidingWindowTimeline({
    events,
    config,
    lastResult,
}: SlidingWindowTimelineProps) {
    const now = useNow(80)
    const { windowMs, limit } = config
    const timelineSpan = windowMs * 2

    const windowStart = now - windowMs
    const windowEnd = now

    const inWindow = events.filter(
        (e) => e.timestamp >= windowStart && e.timestamp <= windowEnd
    )
    const allowedCount = inWindow.filter((e) => e.allowed).length
    const deniedCount = inWindow.length - allowedCount

    const windows = useMemo((): TimelineWindow[] => {
        return [
            {
                id: 'sliding-window',
                start: windowStart,
                end: windowEnd,
                isCurrent: true,
                eventCount: allowedCount,
                limit,
                label: 'Window',
            },
        ]
    }, [windowStart, windowEnd, allowedCount, limit])

    const resetRemaining = lastResult?.windowStart
        ? Math.max(0, lastResult.windowStart + windowMs - now)
        : 0

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
                        Limit: <b>{limit}</b> / {(windowMs / 1000).toFixed(0)}s
                    </span>
                    <span className="
                      rounded-full border border-border/70 bg-card/80 px-2.5
                      py-1
                    ">
                        Remaining: <b>{lastResult?.remaining ?? '—'}</b>
                    </span>
                    <span className="
                      rounded-full border border-border/70 bg-card/80 px-2.5
                      py-1
                    ">
                        Oldest expires in: <b>{formatMs(resetRemaining)}</b>
                    </span>
                </div>
            </div>

            <UnifiedTimelineBase
                events={events}
                timelineSpan={timelineSpan}
                windows={windows}
            />

            <div className="
              flex flex-wrap items-center gap-4 text-sm text-muted-foreground
            ">
                <span>
                    In window: <b>{inWindow.length}</b>
                </span>
                <span>
                    Allowed: <b className="text-emerald-600">{allowedCount}</b>
                </span>
                <span>
                    Denied: <b className="text-rose-600">{deniedCount}</b>
                </span>
            </div>
        </div>
    )
}
