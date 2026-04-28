'use client'

import { useRefreshInterval } from '@/simulation/hooks/useRefreshInterval'
import { slidingWindowConfigAtom } from '@/simulation/store/atoms'
import type { RateLimitResult, RequestEvent } from '@/simulation/types'
import { formatMs } from '@/simulation/utils'
import { useAtomValue } from 'jotai'
import { useMemo, useState } from 'react'
import { UnifiedTimelineBase, type TimelineWindowType } from './shared'

type Props = {
    events: RequestEvent[]
    now?: number
    lastResult?: RateLimitResult
    isRunning: boolean
}

export default function SlidingWindowTimeline({
    events,
    now: nowProp,
    lastResult,
    isRunning,
}: Props) {
    useRefreshInterval(isRunning)
    const { limit, windowMs } = useAtomValue(slidingWindowConfigAtom)

    // Use provided now prop, or compute once: 0 for SSR, Date.now() for client
    const [nowFallback] = useState(() =>
        nowProp !== undefined || typeof window === 'undefined' ? 0 : Date.now()
    )

    const now = nowProp ?? nowFallback
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
                              inline-block size-3 border border-blue-300
                              bg-blue-100
                            "
                        />
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

            <div
                className="
                  mt-2 flex items-center gap-4 text-sm text-muted-foreground
                ">
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
