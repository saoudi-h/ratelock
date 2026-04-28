'use client'

import { cn } from '@/lib/utils'

interface TimelineNowMarkerProps {
    leftPct: number
    label?: string
    className?: string
    variant?: 'default' | 'primary' | 'accent'
}

const variantClasses = {
    default: 'border-blue-600/50 bg-blue-600/50 border-blue-700',
    primary: 'border-primary bg-primary/50 border-primary/70',
    accent: 'border-accent bg-accent/50 border-accent/70',
}

export function TimelineNowMarker({
    leftPct,
    label = 'Now',
    className,
    variant = 'default',
}: TimelineNowMarkerProps) {
    return (
        <div className={cn('absolute inset-y-0 w-0', className)} style={{ left: `${leftPct}%` }}>
            <div className={cn('h-full border-l', variantClasses[variant])} />
            {label && (
                <div
                    className={cn(
                        `
                          absolute -bottom-0.5 -translate-x-1/2 rounded-t-sm
                          border px-2 py-1 text-xs text-white backdrop-blur-sm
                        `,
                        variantClasses[variant]
                    )}>
                    {label}
                </div>
            )}
        </div>
    )
}
