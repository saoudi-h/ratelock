'use client'

import { useMemo } from 'react'
import { useNow } from './use-simulation'
import type { RequestEvent } from '@/simulation/types'

export interface TimelineWindow {
    id: string
    start: number
    end: number
    isCurrent?: boolean
    isPast?: boolean
    isFuture?: boolean
    eventCount?: number
    limit?: number
    label?: string
}

interface UnifiedTimelineBaseProps {
    events: RequestEvent[]
    windows?: TimelineWindow[]
    timelineSpan: number
    height?: number
    className?: string
    accentByEvent?: (event: RequestEvent) => string
}

const DEFAULT_ALLOWED = 'border-emerald-500 bg-emerald-500/25'
const DEFAULT_DENIED = 'border-rose-500 bg-rose-500/30'

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function getTimelineBounds(now: number, timelineSpan: number) {
    const halfSpan = timelineSpan / 2

    return {
        timelineStart: now - halfSpan,
        timelineEnd: now + halfSpan,
    }
}

export function UnifiedTimelineBase({
    events,
    windows = [],
    timelineSpan,
    height = 184,
    className,
    accentByEvent,
}: UnifiedTimelineBaseProps) {
    const now = useNow(80)
    const { timelineStart, timelineEnd } = getTimelineBounds(now, timelineSpan)

    const visibleEvents = useMemo(() => {
        return events
            .filter(
                (event) => event.timestamp >= timelineStart && event.timestamp <= timelineEnd
            )
            .map((event) => {
                const left = clamp(((event.timestamp - timelineStart) / timelineSpan) * 100, 0, 100)
                const top = 92
                const accent =
                    accentByEvent?.(event) ??
                    (event.allowed ? DEFAULT_ALLOWED : DEFAULT_DENIED)

                return { event, left, top, accent }
            })
    }, [events, timelineEnd, timelineStart, timelineSpan, accentByEvent])

    const positionedWindows = useMemo(() => {
        return windows.map((window) => {
            const left = clamp(((window.start - timelineStart) / timelineSpan) * 100, 0, 100)
            const width = clamp(((window.end - window.start) / timelineSpan) * 100, 0, 100 - left)
            return { ...window, left, width }
        })
    }, [timelineSpan, timelineStart, windows])

    return (
        <div
            className={`
              relative overflow-hidden rounded-lg border border-border
              bg-background
              ${className ?? ''}
            `}
            style={{ height }}
        >
            <div className="
              simulation-grid pointer-events-none absolute inset-0 opacity-45
            " />
            <div className="
              pointer-events-none absolute inset-x-0 top-1/2 h-px bg-border
            " />

            {positionedWindows.map((window) => {
                const tone = window.isCurrent
                    ? 'border-primary/50 bg-primary/8'
                    : window.isPast
                      ? 'border-border bg-muted/25'
                      : 'border-border/70 bg-muted/10'

                return (
                    <div
                        key={window.id}
                        className={`
                          absolute inset-y-3 border-l
                          ${tone}
                        `}
                        style={{ left: `${window.left}%`, width: `${window.width}%` }}
                    >
                        <div className="
                          flex items-start justify-between gap-2 p-2.5
                        ">
                            {window.label ? (
                                <p className="
                                  text-[10px] font-medium tracking-[0.16em]
                                  text-muted-foreground uppercase
                                ">
                                    {window.label}
                                </p>
                            ) : null}
                            {window.eventCount !== undefined && window.limit !== undefined ? (
                                <div className="
                                  bg-background/90 px-1.5 py-0.5 font-mono
                                  text-[10px] text-muted-foreground
                                ">
                                    <span className={window.eventCount > window.limit ? `
                                      text-rose-500
                                    ` : `text-foreground`}>
                                        {window.eventCount}
                                    </span>{' '}
                                    / {window.limit}
                                </div>
                            ) : null}
                        </div>
                    </div>
                )
            })}

            <div className="
              pointer-events-none absolute inset-y-0 left-1/2 w-px
              -translate-x-1/2 bg-primary/30
            " />
            <div className="
              pointer-events-none absolute top-2 left-1/2 -translate-x-1/2
              bg-background px-1.5 py-0.5 font-mono text-[10px]
              tracking-[0.16em] text-primary uppercase
            ">
                now
            </div>

            {visibleEvents.map(({ event, left, top, accent }) => (
                <div
                    key={event.id}
                    className="absolute -translate-1/2"
                    style={{ left: `${left}%`, top }}
                    title={`${event.allowed ? 'allowed' : 'denied'} · ${event.remaining} remaining`}
                >
                    <div className={`
                      size-3 rounded-full border-2
                      ${accent}
                    `} />
                </div>
            ))}
        </div>
    )
}
