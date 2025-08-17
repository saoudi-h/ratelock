import React from 'react'
import { cn } from '../../lib/utils'

export const SectionWrapper = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                {...props}
                className={cn(
                    `
                      mx-auto w-full border-border border-dashed
                      min-xl:max-w-(--breakpoint-xl)
                      min-xl:border-x
                    `,
                    className
                )}
            />
        )
    }
)

SectionWrapper.displayName = 'SectionWrapper'
