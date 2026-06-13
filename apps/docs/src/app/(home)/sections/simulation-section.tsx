'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { isSimulationVisibleAtom } from '@/simulation/atoms'
import { useGSAP } from '@gsap/react'
import { registerReplay } from '../_lib/replay-registry'
import { useSetAtom } from 'jotai'
import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'
import { gsap, registerGsap, ScrollTrigger } from '../_lib/gsap'

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
    () => import('../components/simulation/strategy-tabs').then(m => m.StrategyTabs),
    {
        ssr: false,
        loading: () => <SimulationSkeleton />,
    }
)

/**
 * Wraps the live, in-browser rate-limiting simulation. Replaces
 * `IntersectionObserver` with a GSAP `ScrollTrigger` (one source of
 * truth for scroll across the app) and uses a single fade-up
 * timeline for the header card.
 */
export function SimulationSection() {
    registerGsap()
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef<HTMLElement>(null)
    const headerRef = useRef<HTMLDivElement>(null)
    const simRef = useRef<HTMLDivElement>(null)
    const setIsSimulationVisible = useSetAtom(isSimulationVisibleAtom)

    useGSAP(
        () => {
            if (!ref.current) return
            const root = ref.current

            ScrollTrigger.create({
                trigger: root,
                start: 'top 95%',
                once: true,
                onEnter: () => {
                    setIsVisible(true)
                    setIsSimulationVisible(true)
                },
            })

            const tl = gsap.timeline()

            if (headerRef.current) {
                tl.from(headerRef.current, {
                    y: 30,
                    opacity: 0,
                    filter: 'blur(8px)',
                    duration: 0.9,
                    ease: 'expo.out',
                    scrollTrigger: {
                        trigger: root,
                        start: 'top 85%',
                        once: true,
                    },
                })
            }

            if (simRef.current) {
                tl.from(simRef.current, {
                    y: 40,
                    opacity: 0,
                    filter: 'blur(10px)',
                    duration: 1,
                    ease: 'expo.out',
                    delay: 0.2,
                    scrollTrigger: {
                        trigger: root,
                        start: 'top 80%',
                        once: true,
                    },
                })
            }

            return registerReplay(() => tl.restart(true, false))
        },
        { scope: ref }
    )

    return (
        <section ref={ref} className="relative bg-muted">
            <div
                className="
              mx-auto max-w-7xl px-6 py-20
              md:py-28
            ">
                <div ref={headerRef} className="mb-12 md:mb-16">
                    <h2
                        className="
                      font-heading text-3xl font-semibold tracking-tight
                      md:text-4xl
                    ">
                        Try it live
                    </h2>
                    <p className="mt-4 max-w-lg text-muted-foreground">
                        Interactive rate limiting simulation running entirely in your browser. Send
                        requests, adjust parameters, and watch the limits in action.
                    </p>
                </div>

                <div
                    ref={simRef}
                    className="
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
