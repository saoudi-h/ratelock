'use client'

import { cn } from '@/lib/utils'
import type { RequestEvent } from '@/simulation/types'
import { motion } from 'framer-motion'

interface TimelineEventProps {
    event: RequestEvent
    leftPct: number
    className?: string
    size?: 'sm' | 'md' | 'lg'
    showTooltip?: boolean
    isLast: boolean
}

const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
}

export function TimelineEvent({
    event,
    leftPct,
    className,
    size = 'md',
    showTooltip = true,
}: TimelineEventProps) {
    const baseClasses = cn(
        `
          absolute top-1/2 -translate-y-1/2 rounded-full shadow-sm
          transition-all
          hover:scale-150
        `,
        sizeClasses[size],
        event.allowed
            ? `
              bg-emerald-500/50
              hover:bg-emerald-500/70
            `
            : `
              bg-rose-500/50
              hover:bg-rose-500/70
            `,
        showTooltip && 'group',
        className
    )

    return (
        <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="group absolute top-1/2 -translate-y-1/2"
            style={{ left: `${leftPct}%` }}>
            <div className={baseClasses} />
            <div
                className="
                  absolute left-1/2 z-10 mt-2 -translate-x-1/2 rounded-sm border
                  bg-popover px-2 py-1 text-[10px] whitespace-nowrap
                  text-popover-foreground opacity-0 transition-opacity
                  group-hover:opacity-100
                ">
                {new Date(event.timestamp).toLocaleTimeString()} •{' '}
                {event.allowed ? 'Allowed' : 'Denied'}
            </div>
        </motion.div>
    )
}
