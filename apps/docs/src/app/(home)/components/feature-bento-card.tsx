'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Icon } from '@iconify/react'
import { MotionCardBentoBase } from '../sections/CardBentoBase'

interface FeatureBentoCardProps {
    title: string
    description: string
    icon: string
    iconColor: string
    iconBgColor: string
    colSpan?: '1' | '2'
    children?: ReactNode
    footerTags?: string[]
}

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring' as const,
            stiffness: 110,
            damping: 14
        }
    }
}

export function FeatureBentoCard({
    title,
    description,
    icon,
    iconColor,
    iconBgColor,
    colSpan = '1',
    children,
    footerTags
}: FeatureBentoCardProps) {
    return (
        <MotionCardBentoBase
            variants={itemVariants}
            wrapperClassName={`
              group relative flex flex-col justify-between
              ${colSpan === '2' ? 'md:col-span-2' : ''}
            `}
        >
            <div className={`
              grid gap-8
              ${colSpan === '2' ? `
                items-start
                md:grid-cols-2
              ` : ''}
            `}>
                <div>
                    <div className={`
                      flex size-12 items-center justify-center rounded-2xl
                      ${iconBgColor}
                      ${iconColor}
                    `}>
                        <Icon icon={icon} className="size-6" />
                    </div>
                    <h3 className="
                      mt-8 font-heading text-xl font-bold tracking-tight
                      text-foreground
                    ">
                        {title}
                    </h3>
                    <p className="mt-3 text-sm/relaxed text-muted-foreground">
                        {description}
                    </p>
                </div>
                
                {children && (
                    <div className="w-full">
                        {children}
                    </div>
                )}
            </div>

            {footerTags && footerTags.length > 0 && (
                <div className="
                  mt-8 flex flex-wrap items-center gap-4 border-t
                  border-border/20 pt-5 text-xs font-semibold
                  text-muted-foreground
                ">
                    {footerTags.map((tag, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                            <Icon icon="lucide:check" className="
                              size-3.5 text-emerald-500
                            " /> 
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </MotionCardBentoBase>
    )
}
