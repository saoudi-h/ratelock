'use client'

import { useMemo } from 'react'
import type { RequestEvent, IndividualFixedWindowConfig } from '@/simulation/types'
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
}

export function IndividualFixedWindowTimeline({
    events,
    config,
    lastResult,
    startTime,
}: IndividualFixedWindowTimelineProps) {
    const now = useNow(100)
    const { windowMs, limit } = config
    const timelineSpan = windowMs * 3

    // Reconstruction rigoureuse des fenêtres à déclenchement dynamique
    const windows = useMemo((): TimelineWindow[] => {
        if (events.length === 0) return []

        const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp)
        const result: TimelineWindow[] = []
        
        let currentWindow: TimelineWindow | null = null
        let windowIndex = 0

        for (const event of sortedEvents) {
            if (!currentWindow || event.timestamp >= currentWindow.end) {
                // Une nouvelle fenêtre dynamique ne commence que lors du premier appel après expiration !
                const start = event.timestamp
                const end = start + windowMs
                currentWindow = {
                    id: `window-${windowIndex++}`,
                    start,
                    end,
                    eventCount: 0,
                    limit,
                }
                result.push(currentWindow)
            }
            
            // On incrémente le compteur de requêtes autorisées pour cette fenêtre
            if (event.allowed) {
                currentWindow.eventCount = (currentWindow.eventCount || 0) + 1
            }
        }

        // Labellisation en fonction du temps présent (now)
        return result.map((w) => {
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
                
                {/* Badges de taille fixe pour éliminer les décalages visuels */}
                <div className="
                  flex flex-wrap items-center gap-2 font-mono text-xs
                ">
                    <span className="
                      inline-flex items-center justify-between w-40 rounded-full border border-border/60
                      bg-card/85 px-3 py-1 shadow-2xs text-muted-foreground backdrop-blur-xs
                    ">
                        Limit: <b className="text-foreground">{limit} / key</b>
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
              flex flex-wrap items-center gap-4 text-xs text-muted-foreground
            ">
                <span>
                    Total: <b>{events.length}</b>
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
