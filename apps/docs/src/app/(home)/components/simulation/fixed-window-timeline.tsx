'use client'

import { useMemo } from 'react'
import type { RequestEvent, FixedWindowConfig } from '@/simulation/types'
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
}

export function FixedWindowTimeline({
    events,
    config,
    lastResult,
}: FixedWindowTimelineProps) {
    const now = useNow(80)
    const { windowMs, limit } = config
    const timelineSpan = windowMs * 3

    const windows = useMemo((): TimelineWindow[] => {
        const baseTime = lastResult?.reset ? lastResult.reset - windowMs : now
        const currentWindowIndex = Math.floor((now - baseTime) / windowMs)

        const result: TimelineWindow[] = []
        for (let i = currentWindowIndex - 2; i <= currentWindowIndex + 2; i++) {
            const windowStart = baseTime + i * windowMs
            const windowEnd = windowStart + windowMs
            const windowEvents = events.filter(
                (e) => e.timestamp >= windowStart && e.timestamp < windowEnd
            )

            const isCurrent = windowStart <= now && now < windowEnd
            const isPast = windowEnd <= now
            const isFuture = windowStart > now

            result.push({
                id: `window-${i}`,
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
    }, [now, windowMs, limit, events, lastResult])

    const allowedCount = events.filter((e) => e.allowed).length
    const deniedCount = events.length - allowedCount
    const resetRemaining = lastResult?.reset ? Math.max(0, lastResult.reset - now) : 0

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
                        Reset in: <b>{formatMs(resetRemaining)}</b>
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
                    Total: <b>{events.length}</b>
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
