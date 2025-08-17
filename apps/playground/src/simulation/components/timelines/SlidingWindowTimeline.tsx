'use client'

import { formatMs } from '@/simulation/utils'
import { slidingWindowConfigAtom } from '@/simulation/store/atoms'
import type { RateLimitResult, RequestEvent } from '@/simulation/types'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { UnifiedTimelineBase, type TimelineWindowType } from './shared'
import { useRefreshInterval } from '@/simulation/hooks/useRefreshInterval'

type Props = {
    events: RequestEvent[]
    now?: number
    lastResult?: RateLimitResult
    isRunning: boolean
}

export default function SlidingWindowTimeline({ events, now: nowProp, lastResult, isRunning }: Props) {
    useRefreshInterval(isRunning)
    const { limit, windowMs } = useAtomValue(slidingWindowConfigAtom)
    const now = nowProp ?? Date.now()
    const timelineSpan = windowMs * 3

    const windowStart = now - windowMs
    const windowEnd = now
    const inWindow = events.filter(e => e.timestamp >= windowStart && e.timestamp <= windowEnd)
    const allowedCount = inWindow.filter(e => e.allowed).length
    const deniedCount = inWindow.length - allowedCount

    const resetRemaining = lastResult?.reset ? Math.max(0, lastResult.reset - now) : undefined

    const windows: TimelineWindowType[] = useMemo(
        () => [
            {
                id: 'sliding-window',
                start: windowStart,
                end: windowEnd,
                isActive: true,
                eventCount: allowedCount,
                limit,
                label: 'Sliding Window',
            },
        ],
        [windowStart, windowEnd, allowedCount, limit]
    )

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
                        <span className="w-3 h-3 bg-blue-100 border border-blue-300 inline-block" />
                        Sliding window
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
                nowMarkerLabel="now"
                isRunning={isRunning}
            />

            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-4">
                <span>
                    In window: <b>{inWindow.length}</b>
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
