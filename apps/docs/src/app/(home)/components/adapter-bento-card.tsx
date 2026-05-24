'use client'

import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/react'
import { MotionCardBentoBase } from '../sections/CardBentoBase'

interface AdapterBentoCardProps {
    name: string
    tagline: string
    bestFor: string
    metrics: { name: string; val: string }[]
    icon: string
    brandIcon: string
    color: string
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

export function AdapterBentoCard({
    name,
    tagline,
    bestFor,
    metrics,
    icon,
    brandIcon,
    color
}: AdapterBentoCardProps) {
    return (
        <MotionCardBentoBase 
            variants={itemVariants} 
            whileHover={{ y: -4 }} 
            transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }} 
            className="">
            <div className="">
                {/* Adapter Header */}
                <div className="flex items-center justify-between">
                    <div className={`
                      flex size-11 items-center justify-center rounded-2xl
                      bg-muted/65
                      ${color}
                    `}>
                        <Icon icon={icon} className="size-6" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Icon icon={brandIcon} className="size-5" />
                        <Badge variant="outline" className="
                          border-border/40 bg-background/50 font-mono
                          text-[10px] font-bold tracking-wider
                          text-muted-foreground uppercase
                        ">
                            Driver
                        </Badge>
                    </div>
                </div>

                {/* Title & Tagline */}
                <h3 className="
                  mt-6 font-heading text-xl font-bold tracking-tight
                  text-foreground
                ">
                    {name}
                </h3>
                <p className="mt-2 text-sm/relaxed text-muted-foreground">
                    {tagline}
                </p>
            </div>

            {/* Telemetry Visual Box (High-fidelity monospaced stats) */}
            <div className="
              mt-6 space-y-2 rounded-2xl border border-border/40 bg-muted/40 p-4
              font-mono text-[11px] shadow-xs select-none
            ">
                <div className="
                  border-b border-border/20 pb-1.5 text-[9px] font-bold
                  tracking-wider text-muted-foreground/80 uppercase select-none
                ">
                    Backend telemetry
                </div>
                {metrics.map((m, index) => (
                    <div key={index} className="
                      mt-2 flex items-center justify-between
                    ">
                        <span className="text-muted-foreground/90">{m.name}:</span>
                        <span className="
                          rounded-lg border border-border/40 bg-background px-2
                          py-0.5 font-bold text-foreground shadow-xs
                        ">{m.val}</span>
                    </div>
                ))}
            </div>

            {/* Best For footer block */}
            <div className="
              relative mt-6 flex flex-col justify-end border-t border-border/20
              pt-4
            ">
                <span className="
                  text-[10px] font-bold tracking-wide text-muted-foreground/60
                  uppercase select-none
                ">
                    Recommended for
                </span>
                <span className="
                  mt-1 text-sm/normal font-semibold text-foreground
                ">
                    {bestFor}
                </span>
            </div>
        </MotionCardBentoBase>
    )
}
