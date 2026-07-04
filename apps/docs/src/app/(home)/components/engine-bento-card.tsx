'use client'

import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/react'
import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import { BentoBase } from './bento-base'
import { gsap, registerGsap } from '../_lib/gsap'

interface EngineBentoCardProps {
    name: string
    tagline: string
    bestFor: string
    metrics: { name: string; val: string }[]
    icon: string
    brandIcon: string
    color: string
    /** Position in the parent row — used to stagger entrance direction */
    index?: number
}

/**
 * Storage-engine card (Local / Redis / Postgres).
 *
 * Each card lifts in with a slight tilt, scaled-up icon, and the
 * telemetry table builds row-by-row. The tilt direction alternates
 * with the index so the row feels like a fanning hand rather than a
 * uniform slide.
 */
export function EngineBentoCard({
    name,
    tagline,
    bestFor,
    metrics,
    icon,
    brandIcon,
    color,
    index = 0,
}: EngineBentoCardProps) {
    registerGsap()
    const ref = useRef<HTMLDivElement>(null)

    useGSAP(
        () => {
            if (!ref.current) return
            const root = ref.current

            const tiltDir = index % 2 === 0 ? -6 : 6

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: root,
                    start: 'top 85%',
                    once: true,
                },
                delay: index * 0.08,
            })

            tl.from(root, {
                y: 50,
                rotateZ: tiltDir,
                opacity: 0,
                filter: 'blur(10px)',
                duration: 1,
                ease: 'expo.out',
            })
                .from(
                    root.querySelector('[data-engine-icon]'),
                    {
                        scale: 0.6,
                        rotate: -15,
                        opacity: 0,
                        duration: 0.5,
                        ease: 'back.out(2)',
                    },
                    '-=0.55'
                )
                .from(
                    root.querySelectorAll('[data-engine-brand], [data-engine-driver]'),
                    {
                        x: 10,
                        opacity: 0,
                        duration: 0.4,
                        ease: 'expo.out',
                        stagger: 0.05,
                    },
                    '<+=0.1'
                )
                .from(
                    root.querySelectorAll('[data-engine-title], [data-engine-tagline]'),
                    {
                        y: 12,
                        opacity: 0,
                        duration: 0.5,
                        ease: 'expo.out',
                        stagger: 0.07,
                    },
                    '-=0.3'
                )
                .from(
                    root.querySelectorAll('[data-engine-metric]'),
                    {
                        x: -10,
                        opacity: 0,
                        duration: 0.4,
                        ease: 'expo.out',
                        stagger: 0.06,
                    },
                    '-=0.3'
                )
                .from(
                    root.querySelector('[data-engine-footer]'),
                    {
                        y: 10,
                        opacity: 0,
                        duration: 0.5,
                        ease: 'expo.out',
                    },
                    '-=0.3'
                )
        },
        { scope: ref }
    )

    return (
        <div ref={ref} className="perspective-[900px]">
            <BentoBase>
                <div>
                    <div className="flex items-center justify-between">
                        <div
                            data-engine-icon
                            className={`
                              flex size-11 items-center justify-center
                              rounded-2xl bg-muted/65
                              ${color}
                            `}>
                            <Icon icon={icon} className="size-6" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Icon data-engine-brand icon={brandIcon} className="
                              size-5
                            " />
                            <Badge
                                data-engine-driver
                                variant="outline"
                                className="
                                  border-border/40 bg-background/50 font-mono
                                  text-[10px] font-bold tracking-wider
                                  text-muted-foreground uppercase
                                ">
                                Driver
                            </Badge>
                        </div>
                    </div>
                    <h3
                        data-engine-title
                        className="
                          mt-6 font-heading text-xl font-bold tracking-tight
                          text-foreground
                        ">
                        {name}
                    </h3>
                    <p
                        data-engine-tagline
                        className="mt-2 text-sm/relaxed text-muted-foreground">
                        {tagline}
                    </p>
                </div>

                <div
                    className="
                      mt-6 space-y-2 rounded-2xl border border-border/40
                      bg-muted/40 p-4 font-mono text-[11px] shadow-xs
                      select-none
                    ">
                    <div
                        className="
                          border-b border-border/20 pb-1.5 text-[9px] font-bold
                          tracking-wider text-muted-foreground/80 uppercase
                        ">
                        Backend telemetry
                    </div>
                    {metrics.map(m => (
                        <div
                            key={m.name}
                            data-engine-metric
                            className="mt-2 flex items-center justify-between">
                            <span className="text-muted-foreground/90">{m.name}:</span>
                            <span
                                className="
                                  rounded-lg border border-border/40
                                  bg-background px-2 py-0.5 font-bold
                                  text-foreground shadow-xs
                                ">
                                {m.val}
                            </span>
                        </div>
                    ))}
                </div>

                <div
                    data-engine-footer
                    className="
                      relative mt-6 flex flex-col justify-end border-t
                      border-border/20 pt-4
                    ">
                    <span
                        className="
                          text-[10px] font-bold tracking-wide
                          text-muted-foreground/60 uppercase select-none
                        ">
                        Recommended for
                    </span>
                    <span className="
                      mt-1 text-sm/normal font-semibold text-foreground
                    ">
                        {bestFor}
                    </span>
                </div>
            </BentoBase>
        </div>
    )
}
