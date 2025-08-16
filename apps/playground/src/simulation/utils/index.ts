/**
 * Format milliseconds to human readable string
 * Used across all timeline components
 */
export function formatMs(ms?: number): string {
    if (!ms || ms <= 0) return '—'
    if (ms < 1000) return `${ms}ms`
    const s = Math.round(ms / 100) / 10
    return `${s}s`
}

/**
 * Calculate timeline boundaries for consistent timeline rendering
 */
export function calculateTimelineBounds(now: number, span: number) {
    const timelineStart = now - span / 2
    const timelineEnd = now + span / 2
    return { timelineStart, timelineEnd, timelineSpan: span }
}

/**
 * Calculate position percentage for timeline items
 */
export function calculateTimelinePosition(
    itemStart: number,
    itemEnd: number,
    timelineStart: number,
    timelineSpan: number
) {
    const leftPct = ((itemStart - timelineStart) / timelineSpan) * 100
    const widthPct = ((itemEnd - itemStart) / timelineSpan) * 100
    return { leftPct, widthPct }
}

/**
 * Check if timeline item is visible within bounds
 */
export function isTimelineItemVisible(
    itemStart: number,
    itemEnd: number,
    timelineStart: number,
    timelineEnd: number,
    buffer: number = 0.1
) {
    const timelineSpan = timelineEnd - timelineStart
    const bufferAmount = timelineSpan * buffer
    return itemEnd > timelineStart - bufferAmount && itemStart < timelineEnd + bufferAmount
}