'use client'

import { type WindowState } from '@/simulation/hooks/useIndividualFixedWindow'
import { formatMs } from '@/simulation/utils'
import { individualFixedWindowConfigAtom } from '@/simulation/store/atoms'
import type { RateLimitResult, RequestEvent } from '@/simulation/types'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { UnifiedTimelineBase, type TimelineWindowType } from './shared'
import { useRefreshInterval } from '@/simulation/hooks/useRefreshInterval'

type Props = {
    events: RequestEvent[]
    now?: number
    lastResult?: RateLimitResult
    windows?: WindowState[]
    isRunning: boolean
}

export default function IndividualFixedWindowTimeline({
    events,
    now: nowProp,
    lastResult,
    windows: windowsProp,
    isRunning
}: Props) {
    useRefreshInterval(isRunning)
    const { windowMs, limit } = useAtomValue(individualFixedWindowConfigAtom)
    const now = nowProp ?? Date.now()
    const timelineSpan = windowMs * 4 // Show 4x window duration

    // Create windows for the timeline
    const windows: TimelineWindowType[] = useMemo(() => {
        if (!windowsProp) return []

        return windowsProp.map(window => {
            const windowEvents = events.filter(event => window.eventIds.includes(event.id))
            const isActive = window.start <= now && now < window.end
            const isExpired = now >= window.end

            return {
                id: `window-${window.start}`,
                start: window.start,
                end: window.end,
                isActive,
                isExpired,
                eventCount: windowEvents.length,
                limit,
                label: isActive ? 'Active' : isExpired ? 'Expired' : 'Future'
            }
        })
    }, [windowsProp, now, limit, events])

    // Calculate stats for visible events
    const visibleEvents = useMemo(() => {
        const timelineStart = now - timelineSpan / 2
        const timelineEnd = now + timelineSpan / 2
        return events.filter(e => e.timestamp >= timelineStart && e.timestamp <= timelineEnd)
    }, [events, now, timelineSpan])

    const allowedCount = visibleEvents.filter(e => e.allowed).length
    const deniedCount = visibleEvents.length - allowedCount
    const resetRemaining = lastResult?.reset ? Math.max(0, lastResult.reset - now) : undefined
    const activeWindows = windowsProp?.filter(w => w.start <= now && now < w.end).length ?? 0

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
                        <span className="w-3 h-3 bg-purple-100 border border-purple-300 inline-block" />
                        Individual Window
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span>
                        Limit: <b>{limit}</b> / {windowMs}ms per user
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
                nowMarkerLabel="now"
                isRunning={isRunning}
            />

            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-4">
                <span>
                    Total: <b>{visibleEvents.length}</b>
                </span>
                <span>
                    Allowed: <b className="text-emerald-600/50">{allowedCount}</b>
                </span>
                <span>
                    Denied: <b className="text-rose-600/50">{deniedCount}</b>
                </span>
                <span>
                    Active Windows: <b className="text-purple-600">{activeWindows}</b>
                </span>
            </div>
        </div>
    )
}
