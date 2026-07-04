'use client'

import { cn } from '@/lib/utils'

interface BentoBaseProps {
    children: React.ReactNode
    /** Classes for the inner content panel */
    className?: string
    /** Classes for the outer wrapper (grid placement, etc.) */
    wrapperClassName?: string
    /** Inner padding preset */
    density?: 'default' | 'compact'
    /** Optional `data-*` hooks for animation targeting */
    'data-reveal'?: string
}

/**
 * Visual chrome for every bento card on the home page.
 * - Glassy padded inner panel
 * - Subtle top-down highlight overlay
 * - Group-hover affordance
 *
 * Animation timing is left to the caller; this is purely structural.
 */
export function BentoBase({
    children,
    className,
    wrapperClassName,
    density = 'default',
    ...rest
}: BentoBaseProps) {
    return (
        <div
            data-bento
            className={cn(
                `
                  group relative size-full rounded-4xl bg-card/60 p-1 shadow-xs
                  transition-colors duration-200 select-none
                  hover:bg-card/60
                `,
                wrapperClassName
            )}
            {...rest}>
            <div className={cn('relative size-full', density === 'compact' ? `
              p-4
            ` : `p-6`)}>
                <div
                    aria-hidden
                    className="
                      pointer-events-none absolute inset-x-0 top-0 h-3/5
                      rounded-3xl bg-linear-to-b from-background to-transparent
                    "
                />
                <div className={cn(`
                  relative flex size-full flex-col justify-between
                `, className)}>
                    {children}
                </div>
            </div>
        </div>
    )
}
