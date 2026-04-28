'use client'

import { cn } from '@/lib/utils'
import type { RequestEvent } from '@/simulation/types'
import {
    calculateTimelineBounds,
    calculateTimelinePosition,
    isTimelineItemVisible,
} from '@/simulation/utils'
import { AnimatePresence, useAnimationFrame } from 'framer-motion'
import { useEffect, useMemo, useRef } from 'react'
import { TimelineEvent } from './TimelineEvent'
import { TimelineNowMarker } from './TimelineNowMarker'

export interface TimelineWindow {
    id: string
    start: number
    end: number
    isActive?: boolean
    isExpired?: boolean
    isCurrent?: boolean
    eventCount?: number
    limit?: number
    label?: string
}

interface UnifiedTimelineBaseProps {
    now: number
    timelineSpan: number
    events: RequestEvent[]
    windows?: TimelineWindow[]
    showNowMarker?: boolean
    nowMarkerLabel?: string
    className?: string
    height?: string
    children?: React.ReactNode
    isRunning?: boolean
}

export function UnifiedTimelineBase({
    now,
    timelineSpan,
    events,
    windows = [],
    showNowMarker = true,
    nowMarkerLabel = 'Now',
    className,
    height = 'h-48',
    children,
    isRunning = true,
}: UnifiedTimelineBaseProps) {
    const backgroundRef = useRef<HTMLDivElement>(null)
    const lastTimeRef = useRef<number>(now)
    const patternSize = 20

    useAnimationFrame(() => {
        if (!isRunning || !backgroundRef.current) return

        const currentTime = now
        const deltaTime = currentTime - lastTimeRef.current

        if (deltaTime > 0) {
            const containerWidth = backgroundRef.current.parentElement?.offsetWidth || 1000
            const pixelsPerMs = containerWidth / timelineSpan

            const pixelsMoved = deltaTime * pixelsPerMs

            const currentTransform = backgroundRef.current.style.transform
            const currentX = currentTransform
                ? parseFloat(currentTransform.match(/translateX\(([^)]+)px\)/)?.[1] || '0')
                : 0

            let newX = currentX - pixelsMoved

            if (newX <= -patternSize) {
                newX = newX + patternSize
            }

            backgroundRef.current.style.transform = `translateX(${newX}px)`
        }

        lastTimeRef.current = currentTime
    })

    useEffect(() => {
        if (backgroundRef.current) {
            backgroundRef.current.style.transform = 'translateX(0px)'
            lastTimeRef.current = now
        }
    }, [isRunning, now])

    const { timelineStart, timelineEnd } = calculateTimelineBounds(now, timelineSpan)

    const visibleEvents = useMemo(() => {
        return events.filter(event =>
            isTimelineItemVisible(event.timestamp, event.timestamp, timelineStart, timelineEnd)
        )
    }, [events, timelineStart, timelineEnd])

    const visibleWindows = useMemo(() => {
        return windows.filter(window =>
            isTimelineItemVisible(window.start, window.end, timelineStart, timelineEnd)
        )
    }, [windows, timelineStart, timelineEnd])

    const nowMarkerPosition = useMemo(() => {
        const { leftPct } = calculateTimelinePosition(now, now, timelineStart, timelineSpan)
        return leftPct
    }, [now, timelineStart, timelineSpan])

    return (
        <div
            className={cn(
                `
                  relative w-full overflow-hidden rounded-lg border
                  border-dashed bg-background
                `,
                height,
                className
            )}>
            <div
                ref={backgroundRef}
                className="
                  absolute top-0 left-0 h-full w-[200%]
                  bg-[repeating-linear-gradient(45deg,currentColor_0_1px,#0000_0_50%)]
                  bg-size-[10px_10px] text-primary/50 opacity-30
                "
            />

            {visibleWindows.map(window => {
                const { leftPct, widthPct } = calculateTimelinePosition(
                    window.start,
                    window.end,
                    timelineStart,
                    timelineSpan
                )

                const windowClasses = cn(
                    'absolute inset-y-2 rounded-sm border-2 border-dashed',
                    window.isActive && 'border-blue-500/50 bg-blue-500/30',
                    window.isExpired && 'border-gray-500/30 bg-gray-500/20',
                    window.isCurrent && 'border-blue-600/60 bg-blue-600/40',
                    !window.isActive &&
                        !window.isExpired &&
                        !window.isCurrent &&
                        'border-gray-400/30 bg-gray-400/20'
                )

                const shouldShowCount =
                    window.eventCount !== undefined && window.limit !== undefined
                const isOverLimit = shouldShowCount && window.eventCount! > window.limit!

                return (
                    <div
                        key={window.id}
                        className={windowClasses}
                        style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                        }}>
                        {window.label && (
                            <div
                                className="
                                  absolute top-2 left-2 text-xs
                                  text-muted-foreground
                                ">
                                {window.label}
                            </div>
                        )}

                        {shouldShowCount && (
                            <div
                                className={cn(
                                    `
                                      absolute top-1 right-1 rounded-sm px-1.5
                                      py-0.5 text-xs font-medium
                                    `,
                                    isOverLimit
                                        ? 'bg-red-500/80 text-white'
                                        : 'bg-blue-500/80 text-white'
                                )}>
                                {window.eventCount}/{window.limit}
                            </div>
                        )}
                    </div>
                )
            })}

            <AnimatePresence initial={false}>
                {visibleEvents.map((event, index) => {
                    const { leftPct } = calculateTimelinePosition(
                        event.timestamp,
                        event.timestamp,
                        timelineStart,
                        timelineSpan
                    )

                    return (
                        <TimelineEvent
                            key={event.id}
                            event={event}
                            leftPct={leftPct}
                            isLast={index === visibleEvents.length - 1}
                        />
                    )
                })}
            </AnimatePresence>

            {showNowMarker && (
                <TimelineNowMarker leftPct={nowMarkerPosition} label={nowMarkerLabel} />
            )}

            {children}
        </div>
    )
}
