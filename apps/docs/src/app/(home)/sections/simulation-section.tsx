'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useSetAtom } from 'jotai'
import { isSimulationVisibleAtom } from '@/simulation/atoms'
import { Skeleton } from '@/components/ui/skeleton'

function SimulationSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-9 w-80" />
            <div>
                <Skeleton className="h-7 w-48" />
                <Skeleton className="mt-2 h-4 w-72" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    )
}

const StrategyTabs = dynamic(
    () => import('../components/simulation/strategy-tabs').then((m) => m.StrategyTabs),
    {
        ssr: false,
        loading: () => <SimulationSkeleton />,
    }
)

export function SimulationSection() {
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef<HTMLDivElement>(null)
    const setIsSimulationVisible = useSetAtom(isSimulationVisibleAtom)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setIsVisible(true)
                    setIsSimulationVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => observer.disconnect()
    }, [setIsSimulationVisible])

    return (
        <section ref={sectionRef} className="relative bg-muted">
            <div className="
              mx-auto max-w-7xl px-6 py-20
              md:py-28
            ">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                    className="
                      mb-12
                      md:mb-16
                    "
                >
                    <h2 className="
                      font-heading text-3xl font-semibold tracking-tight
                      md:text-4xl
                    ">
                        Try it live
                    </h2>
                    <p className="mt-4 max-w-lg text-muted-foreground">
                        Interactive rate limiting simulation running entirely in your browser.
                        Send requests, adjust parameters, and watch the limits in action.
                    </p>
                </motion.div>

                <div className="
                  overflow-hidden rounded-2xl border border-border/70 bg-card/95
                  p-6 shadow-sm
                  md:p-8
                ">
                    {isVisible ? <StrategyTabs /> : <SimulationSkeleton />}
                </div>
            </div>
        </section>
    )
}
