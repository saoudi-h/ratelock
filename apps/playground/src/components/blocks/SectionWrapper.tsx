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
                      mx-auto w-full border-dashed border-border
                      xl:max-w-(--breakpoint-xl) xl:border-x
                    `,
                    className
                )}
            />
        )
    }
)

SectionWrapper.displayName = 'SectionWrapper'
