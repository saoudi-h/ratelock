'use client'

import { useGSAP } from '@gsap/react'
import { useSetAtom } from 'jotai'
import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { isSimulationVisibleAtom } from '@/simulation/atoms'

import { gsap, registerGsap } from '../_lib/gsap'
import { registerReplay } from '../_lib/replay-registry'

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
 * Wraps the live, in-browser rate-limiting simulation. The observer
 * lazy-loads the interactive UI, while one ScrollTrigger controls the
 * section's entrance timeline.
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

            const revealSimulation = () => {
                setIsVisible(true)
                setIsSimulationVisible(true)
                visibilityObserver.disconnect()
            }
            const visibilityObserver = new IntersectionObserver(
                ([entry]) => {
                    if (entry?.isIntersecting) {
                        revealSimulation()
                    }
                },
                { rootMargin: '0px 0px -5% 0px', threshold: 0 }
            )

            if (root.getBoundingClientRect().top <= window.innerHeight * 0.95) {
                revealSimulation()
            } else {
                visibilityObserver.observe(root)
            }

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: root,
                    start: 'top 85%',
                    once: true,
                    invalidateOnRefresh: true,
                },
            })

            if (headerRef.current) {
                tl.from(headerRef.current, {
                    y: 30,
                    opacity: 0,
                    filter: 'blur(8px)',
                    duration: 0.9,
                    ease: 'expo.out',
                })
            }

            if (simRef.current) {
                tl.from(
                    simRef.current,
                    {
                        y: 40,
                        opacity: 0,
                        filter: 'blur(10px)',
                        duration: 1,
                        ease: 'expo.out',
                    },
                    '-=0.45'
                )
            }

            const unregisterReplay = registerReplay(() => {
                tl.restart(true, false)
            })

            return () => {
                visibilityObserver.disconnect()
                unregisterReplay()
            }
        },
        { scope: ref }
    )

    return (
        <section ref={ref} className="relative bg-muted">
            <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
                <div ref={headerRef} className="mb-12 md:mb-16">
                    <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
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
                      overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-6 shadow-sm
                      md:p-8
                    ">
                    {isVisible ? <StrategyTabs /> : <SimulationSkeleton />}
                </div>
            </div>
        </section>
    )
}
