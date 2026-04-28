'use client'

import { type WindowState } from '@/simulation/hooks/useIndividualFixedWindow'
import { useRefreshInterval } from '@/simulation/hooks/useRefreshInterval'
import { individualFixedWindowConfigAtom } from '@/simulation/store/atoms'
import type { RateLimitResult, RequestEvent } from '@/simulation/types'
import { formatMs } from '@/simulation/utils'
import { useAtomValue } from 'jotai'
import { useMemo, useState } from 'react'
import { UnifiedTimelineBase, type TimelineWindowType } from './shared'

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
    isRunning,
}: Props) {
    useRefreshInterval(isRunning)
    const { windowMs, limit } = useAtomValue(individualFixedWindowConfigAtom)

    // Use provided now prop, or compute once: 0 for SSR, Date.now() for client
    const [nowFallback] = useState(() =>
        nowProp !== undefined || typeof window === 'undefined' ? 0 : Date.now()
    )

    const now = nowProp ?? nowFallback
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
                label: isActive ? 'Active' : isExpired ? 'Expired' : 'Future',
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
            <div
                className="
                  mb-2 flex items-center justify-between text-sm
                  text-muted-foreground
                ">
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                        <span
                            className="
                              inline-block size-2.5 rounded-full bg-emerald-500
                            "
                        />
                        Allowed
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span
                            className="
                              inline-block size-2.5 rounded-full bg-rose-500
                            "
                        />
                        Denied
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span
                            className="
                              inline-block size-3 border border-purple-300
                              bg-purple-100
                            "
                        />
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

            <div
                className="
                  mt-2 flex items-center gap-4 text-sm text-muted-foreground
                ">
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
