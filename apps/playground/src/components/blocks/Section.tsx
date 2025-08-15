import React from 'react'
import { cn } from '../../lib/utils'

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean
}

export const Section = React.forwardRef<HTMLDivElement, SectionProps>(
    ({ className, noPadding = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                {...props}
                className={cn(
                    'mx-auto w-full max-w-(--breakpoint-xl)',
                    noPadding ||
                        `
                      px-4
                      xl:px-6
                      2xl:px-8
                    `,
                    className
                )}
            />
        )
    }
)

Section.displayName = 'Section'
