'use client'

import { fixedWindowConfigAtom } from '@/simulation/store/atoms'
import type { RateLimitResult, RequestEvent } from '@/simulation/types'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { UnifiedTimelineBase, type TimelineWindowType } from './shared'
import { formatMs } from '@/simulation/utils'
import { useRefreshInterval } from '@/simulation/hooks/useRefreshInterval'

type Props = {
    events: RequestEvent[]
    now: number
    simulationStartTime?: number | null
    lastResult?: RateLimitResult
    currentWindowStart?: number | null
    isRunning: boolean
}

export default function FixedWindowTimeline({
    events,
    now,
    simulationStartTime,
    lastResult,
    currentWindowStart,
    isRunning
}: Props) {
    useRefreshInterval(isRunning)
    const { windowMs, limit } = useAtomValue(fixedWindowConfigAtom)
    const timelineSpan = windowMs * 4
    const allowedCount = events.filter(e => e.allowed).length
    const deniedCount = events.length - allowedCount
    const resetRemaining = lastResult?.reset ? Math.max(0, lastResult.reset - now) : undefined

    const windows: TimelineWindowType[] = useMemo(() => {
        const baseTime = currentWindowStart || simulationStartTime || now
        
        const currentWindowIndex = Math.floor((now - baseTime) / windowMs)
        
        const firstWindowIndex = currentWindowIndex - 2
        const lastWindowIndex = currentWindowIndex + 2
        
        const windows = []
        for (let i = firstWindowIndex; i <= lastWindowIndex; i++) {
            const windowStart = baseTime + i * windowMs
            const windowEnd = windowStart + windowMs
            const windowEvents = events.filter(event => event.timestamp >= windowStart && event.timestamp < windowEnd)
            
            const isCurrent = windowStart <= now && now < windowEnd
            
            windows.push({
                id: `window-${i}`,
                start: windowStart,
                end: windowEnd,
                isCurrent,
                isPast: windowEnd <= now,
                isFuture: windowStart > now,
                eventCount: windowEvents.length,
                limit,
                index: i,
            })
        }
        
        return windows.map(window => ({
            id: window.id,
            start: window.start,
            end: window.end,
            isCurrent: window.isCurrent,
            label: window.isCurrent ? 'Current' : window.isPast ? 'Past' : 'Future',
            limit: window.limit,
            eventCount: window.eventCount,
        }))
    }, [now, simulationStartTime, windowMs, currentWindowStart, events, limit])

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        Allowed
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                        Denied
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 border border-dashed border-gray-400 inline-block" />
                        Window
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span>
                        Limit: <b>{limit}</b> / {windowMs}ms
                    </span>
                    <span>
                        Remaining: <b>{lastResult?.remaining ?? '—'}</b>
                    </span>
                    <span>
                        Resets in: <b>{formatMs(resetRemaining)}</b>
                    </span>
                </div>
            </div>

            <UnifiedTimelineBase
                now={now}
                timelineSpan={timelineSpan}
                events={events}
                windows={windows}
                isRunning={isRunning}
                nowMarkerLabel="now"
            />

            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-4">
                <span>
                    Total: <b>{events.length}</b>
                </span>
                <span>
                    Allowed: <b className="text-emerald-600/50">{allowedCount}</b>
                </span>
                <span>
                    Denied: <b className="text-rose-600/50">{deniedCount}</b>
                </span>
            </div>
        </div>
    )
}
