'use client'

import { cn } from '@/lib/utils'
import { Icon } from '@iconify/react'
import type { ReactNode } from 'react'
import { BentoBase } from './bento-base'

interface FeatureBentoCardProps {
    title: string
    description: string
    icon: string
    iconColor: string
    iconBgColor: string
    /** 1-col, 2-col, or 3-col wide on the md grid */
    colSpan?: '1' | '2' | '3'
    children?: ReactNode
    footerTags?: string[]
    /** Tag the root for animation targeting */
    'data-feature'?: string
}

/**
 * Structural skeleton for any feature card in the Features section.
 * Layout only — entrance animation is owned by the parent / wrapper.
 */
export function FeatureBentoCard({
    title,
    description,
    icon,
    iconColor,
    iconBgColor,
    colSpan = '1',
    children,
    footerTags,
    ...rest
}: FeatureBentoCardProps) {
    return (
        <BentoBase
            wrapperClassName={cn(
                'group relative flex flex-col justify-between',
                colSpan === '2' && 'md:col-span-2',
                colSpan === '3' && 'md:col-span-3'
            )}
            {...rest}>
            <div
                className={cn(
                    'grid gap-8',
                    colSpan === '2' && `
                      items-start
                      md:grid-cols-2
                    `
                )}>
                <div>
                    <div
                        data-feature-icon
                        className={cn(
                            `
                              flex size-12 items-center justify-center
                              rounded-2xl
                            `,
                            iconBgColor,
                            iconColor
                        )}>
                        <Icon icon={icon} className="size-6" />
                    </div>
                    <h3
                        data-feature-title
                        className="
                          mt-8 font-heading text-xl font-bold tracking-tight
                          text-foreground
                        ">
                        {title}
                    </h3>
                    <p
                        data-feature-desc
                        className="mt-3 text-sm/relaxed text-muted-foreground">
                        {description}
                    </p>
                </div>

                {children ? <div className="w-full">{children}</div> : null}
            </div>

            {footerTags && footerTags.length > 0 ? (
                <div
                    data-feature-footer
                    className="
                      mt-8 flex flex-wrap items-center gap-4 border-t
                      border-border/20 pt-5 text-xs font-semibold
                      text-muted-foreground
                    ">
                    {footerTags.map(tag => (
                        <span key={tag} className="flex items-center gap-1.5">
                            <Icon
                                icon="lucide:check"
                                className="size-3.5 text-emerald-500"
                            />
                            {tag}
                        </span>
                    ))}
                </div>
            ) : null}
        </BentoBase>
    )
}
