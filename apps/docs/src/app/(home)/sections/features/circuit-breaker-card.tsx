'use client'

import { useGSAP } from '@gsap/react'
import { registerReplay } from '../../_lib/replay-registry'
import { useRef } from 'react'
import { FeatureBentoCard } from '../../components/feature-bento-card'
import { gsap, registerGsap } from '../../_lib/gsap'

/**
 * Card explaining how the circuit breaker isolates failing backends.
 *
 * Motion narrative: enters with a small scale + tilt (like a gauge
 * dropping into place). The amber state pill pulses once on landing
 * to mimic a freshly toggled breaker. Telemetry lines fade in as the
 * gauge "syncs".
 */
export function CircuitBreakerCard() {
    registerGsap()
    const ref = useRef<HTMLDivElement>(null)

    useGSAP(
        () => {
            if (!ref.current) return
            const root = ref.current

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: root,
                    start: 'top 80%',
                    once: true,
                },
            })

            tl.from(root, {
                y: 60,
                scale: 0.94,
                rotateX: -10,
                opacity: 0,
                filter: 'blur(8px)',
                duration: 1,
                ease: 'expo.out',
            })
                .from(
                    root.querySelectorAll('[data-feature-icon], [data-feature-title], [data-feature-desc]'),
                    {
                        y: 12,
                        opacity: 0,
                        duration: 0.55,
                        ease: 'expo.out',
                        stagger: 0.07,
                    },
                    '-=0.55'
                )
                .from(
                    root.querySelector('[data-breaker-panel]'),
                    {
                        y: 14,
                        opacity: 0,
                        duration: 0.5,
                        ease: 'expo.out',
                    },
                    '-=0.35'
                )
                .from(
                    root.querySelectorAll('[data-breaker-row]'),
                    {
                        x: 12,
                        opacity: 0,
                        duration: 0.4,
                        ease: 'expo.out',
                        stagger: 0.08,
                    },
                    '-=0.3'
                )
                .from(
                    root.querySelector('[data-breaker-state]'),
                    {
                        scale: 0.5,
                        opacity: 0,
                        duration: 0.5,
                        ease: 'back.out(2)',
                    },
                    '<'
                )

            return registerReplay(() => {
                tl.restart(true, false)
            })
        },
        { scope: ref }
    )

    return (
        <div ref={ref} className="h-full perspective-[900px]">
            <FeatureBentoCard
                title="Resilient Circuit Breaker"
                description="Avoid thread pool saturation when your databases fail. RateLock automatically halts queries, redirects calls to fail-safes, and probes recovery periodically."
                icon="solar:plug-circle-bold-duotone"
                iconColor="text-amber-500"
                iconBgColor="bg-amber-500/10">
                <div
                    data-breaker-panel
                    className="
                      mt-6 space-y-2.5 rounded-2xl border border-border/40
                      bg-background/50 p-4 font-mono text-[10px] shadow-sm
                      select-none
                    ">
                    <div
                        className="
                          border-b border-border/20 pb-1.5 text-[8px] font-bold
                          tracking-wider text-muted-foreground/60 uppercase
                        ">
                        Circuit telemetry
                    </div>
                    <div data-breaker-row className="
                      flex items-center justify-between
                    ">
                        <span className="text-muted-foreground/80">State:</span>
                        <div
                            data-breaker-state
                            className="flex items-center gap-1.5">
                            <span className="
                              size-2 animate-pulse rounded-full bg-amber-500
                            " />
                            <span className="
                              font-bold tracking-wide text-amber-500 uppercase
                            ">
                                Half-Open
                            </span>
                        </div>
                    </div>
                    <div data-breaker-row className="
                      flex items-center justify-between
                    ">
                        <span className="text-muted-foreground/80">Failure threshold:</span>
                        <span className="font-bold text-foreground">5 failed attempts</span>
                    </div>
                    <div data-breaker-row className="
                      flex items-center justify-between
                    ">
                        <span className="text-muted-foreground/80">Probing rate:</span>
                        <span className="font-bold text-foreground">1 request / 5s</span>
                    </div>
                </div>
            </FeatureBentoCard>
        </div>
    )
}
