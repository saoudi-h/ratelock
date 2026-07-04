'use client'

import type { IndividualFixedWindowConfig, RequestEvent } from '@/simulation/types'
import { useMemo } from 'react'
import { UnifiedTimelineBase, type TimelineWindow } from './unified-timeline'
import { useNow } from './use-simulation'

function formatMs(ms: number): string {
    if (ms <= 0) return '0ms'
    if (ms < 1000) return `${ms}ms`
    return `${Math.round(ms / 100) / 10}s`
}

interface IndividualFixedWindowTimelineProps {
    events: RequestEvent[]
    config: IndividualFixedWindowConfig
    lastResult?: { remaining: number; reset: number }
    startTime: number
    isPlaying: boolean
}

export function IndividualFixedWindowTimeline({
    events,
    config,
    lastResult,
    startTime,
    isPlaying,
}: IndividualFixedWindowTimelineProps) {
    const now = useNow(100, isPlaying)
    const { windowMs, limit } = config
    const timelineSpan = windowMs * 3

    // Reconstruction rigoureuse et stable des fenêtres à déclenchement dynamique
    const windows = useMemo((): TimelineWindow[] => {
        if (events.length === 0) return []

        const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp)
        const windowMap = new Map<number, TimelineWindow>()

        for (const event of sortedEvents) {
            const end = (event.result as any)?.reset
            if (!end) continue

            const start = end - windowMs
            let w = windowMap.get(end)
            if (!w) {
                w = {
                    id: `window-${end}`,
                    start,
                    end,
                    eventCount: 0,
                    limit,
                }
                windowMap.set(end, w)
            }

            if (event.allowed) {
                w.eventCount = (w.eventCount || 0) + 1
            }
        }

        const result = Array.from(windowMap.values()).sort((a, b) => a.start - b.start)

        // Labellisation en fonction du temps présent (now)
        return result.map(w => {
            const isCurrent = w.start <= now && now < w.end
            const isPast = w.end <= now
            const isFuture = w.start > now
            return {
                ...w,
                isCurrent,
                isPast,
                isFuture,
                label: isCurrent ? 'Current' : isPast ? 'Past' : 'Future',
            }
        })
    }, [events, windowMs, limit, now])

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
                    Limit: <span className="font-bold text-foreground">{limit} / key</span>
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
