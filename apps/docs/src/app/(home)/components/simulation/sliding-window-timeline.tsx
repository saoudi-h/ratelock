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
    startTime: number
}

export function SlidingWindowTimeline({
    events,
    config,
    lastResult,
    startTime,
}: SlidingWindowTimelineProps) {
    const now = useNow(100)
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
                start: 0,
                end: windowMs,
                isCurrent: true,
                eventCount: allowedCount,
                limit,
                label: 'Window',
                isStatic: true, // Reste immobile sous le curseur central 'now' !
            },
        ]
    }, [windowMs, allowedCount, limit])

    const resetRemaining = lastResult?.windowStart
        ? Math.max(0, lastResult.windowStart + windowMs - now)
        : 0

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
                
                {/* Badges à largeur fixe et justify-between pour un rendu zéro layout shift */}
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
                      inline-flex items-center justify-between w-44 rounded-full border border-border/60
                      bg-card/85 px-3 py-1 shadow-2xs text-muted-foreground backdrop-blur-xs
                    ">
                        Expires in:{' '}
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
              flex flex-wrap items-center gap-4 text-xs text-muted-foreground
            ">
                <span>
                    In window: <b>{inWindow.length}</b>
                </span>
                <span>
                    Allowed: <b className="text-emerald-600 dark:text-emerald-400">{allowedCount}</b>
                </span>
                <span>
                    Denied: <b className="text-rose-600 dark:text-rose-400">{deniedCount}</b>
                </span>
            </div>
        </div>
    )
}
