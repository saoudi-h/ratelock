'use client'

import { cn } from '@/lib/utils'
import { Icon } from '@iconify/react'
import { useSplitReveal } from '../_hooks/use-split-reveal'

interface SectionHeaderProps {
    /** Pill above the title (e.g. "Network Resilience") */
    eyebrow: string
    /** Icon iconify name for the pill */
    eyebrowIcon?: string
    /** Pill color theme */
    eyebrowTheme?: 'primary' | 'emerald' | 'amber' | 'sky' | 'rose'
    /** Title — line breaks via `\n` produce visual line breaks */
    title: string
    /** Optional supporting copy */
    description?: string
    /** Force title color (overrides default `text-foreground`) */
    titleClassName?: string
    /** Outer wrapper extra classes */
    className?: string
}

const themeMap = {
    primary: 'border-primary/20 bg-primary/5 text-primary',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-500',
    sky: 'border-sky-500/20 bg-sky-500/5 text-sky-500',
    rose: 'border-rose-500/20 bg-rose-500/5 text-rose-500',
}

/**
 * Section opener: eyebrow pill + display title + description.
 *
 * The title is automatically split into lines and revealed in cascade
 * when it scrolls into view. Each section gets its own animation
 * variation by passing different `eyebrowTheme` and styling — keep
 * orchestration in the parent for unique motion per section.
 */
export function SectionHeader({
    eyebrow,
    eyebrowIcon,
    eyebrowTheme = 'primary',
    title,
    description,
    titleClassName,
    className,
}: SectionHeaderProps) {
    const titleRef = useSplitReveal<HTMLHeadingElement>({
        type: 'lines',
        from: { yPercent: 110, opacity: 0 },
        stagger: 0.12,
        duration: 1.1,
        ease: 'expo.out',
        onScroll: true,
        start: 'top 80%',
    })

    return (
        <div className={cn('max-w-2xl', className)}>
            <span
                className={cn(
                    `
                      inline-flex items-center gap-1.5 rounded-full border px-3
                      py-1 text-xs font-semibold select-none
                    `,
                    themeMap[eyebrowTheme]
                )}>
                {eyebrowIcon ? (
                    <Icon icon={eyebrowIcon} className="size-3.5 animate-pulse" />
                ) : null}
                {eyebrow}
            </span>
            <h2
                ref={titleRef}
                className={cn(
                    `
                      mt-4 font-heading text-4xl/snug font-semibold
                      tracking-tight
                      md:text-5xl/snug
                    `,
                    titleClassName
                )}>
                {title.split('\n').map((line, i) => (
                    <span key={i} className="block">
                        {line}
                    </span>
                ))}
            </h2>
            {description ? (
                <p className="
                  mt-4 max-w-lg leading-relaxed text-muted-foreground
                ">
                    {description}
                </p>
            ) : null}
        </div>
    )
}
