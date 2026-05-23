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
                (e) => e.timestamp >= windowStart && e.timestamp < windowEnd
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

    const allowedCount = events.filter((e) => e.allowed).length
    const deniedCount = events.length - allowedCount
    const resetRemaining = lastResult?.reset ? Math.max(0, lastResult.reset - now) : 0

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="
                      inline-flex items-center gap-1.5 rounded-full border
                      border-border/70 bg-card/85 px-3 py-1 text-xs
                      text-muted-foreground shadow-2xs backdrop-blur-xs
                    ">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        Allowed
                    </span>
                    <span className="
                      inline-flex items-center gap-1.5 rounded-full border
                      border-border/70 bg-card/85 px-3 py-1 text-xs
                      text-muted-foreground shadow-2xs backdrop-blur-xs
                    ">
                        <span className="size-2 rounded-full bg-rose-500" />
                        Denied
                    </span>
                </div>
                <div className="
                  flex flex-wrap items-center gap-2 font-mono text-xs
                ">
                    <span className="
                      inline-flex items-center justify-between w-32 rounded-full border border-border/60
                      bg-card/85 px-3 py-1 shadow-2xs text-muted-foreground backdrop-blur-xs
                    ">
                        Limit: <b className="text-foreground">{limit}</b>
                    </span>
                    <span className="
                      inline-flex items-center justify-between w-36 rounded-full border border-border/60
                      bg-card/85 px-3 py-1 shadow-2xs text-muted-foreground backdrop-blur-xs
                    ">
                        Remaining:{' '}
                        <b className="font-mono tabular-nums text-foreground">
                            {lastResult?.remaining ?? '—'}
                        </b>
                    </span>
                    <span className="
                      inline-flex items-center justify-between w-40 rounded-full border border-border/60
                      bg-card/85 px-3 py-1 shadow-2xs text-muted-foreground backdrop-blur-xs
                    ">
                        Reset in:{' '}
                        <b className="font-mono tabular-nums text-foreground">
                            {formatMs(resetRemaining)}
                        </b>
                    </span>
                </div>
            </div>

            <UnifiedTimelineBase
                events={events}
                timelineSpan={timelineSpan}
                windows={windows}
                startTime={startTime}
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
