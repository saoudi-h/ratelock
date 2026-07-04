'use client'

import { useGSAP } from '@gsap/react'
import { registerReplay } from '../../_lib/replay-registry'
import { useRef } from 'react'
import { FeatureBentoCard } from '../../components/feature-bento-card'
import { gsap, registerGsap } from '../../_lib/gsap'

/**
 * Card showing how RateLock's local deny cache intercepts spam before
 * it hits the database.
 *
 * Motion narrative: the card glides in from the left like a shield
 * intercepting incoming traffic. Once landed, the telemetry rows fill
 * in sequentially — like log entries scrolling in. The "Protected"
 * status pill subtly throbs once to confirm the shield is active.
 */
export function DenyCacheShieldCard() {
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
                x: -60,
                opacity: 0,
                filter: 'blur(10px)',
                duration: 0.95,
                ease: 'expo.out',
            })
                .from(
                    root.querySelectorAll('[data-feature-icon], [data-feature-title]'),
                    {
                        y: 14,
                        opacity: 0,
                        duration: 0.6,
                        ease: 'expo.out',
                        stagger: 0.06,
                    },
                    '-=0.6'
                )
                .from(
                    root.querySelectorAll('[data-feature-desc]'),
                    {
                        y: 10,
                        opacity: 0,
                        duration: 0.5,
                        ease: 'expo.out',
                    },
                    '-=0.4'
                )
                .from(
                    root.querySelectorAll('[data-telemetry-row]'),
                    {
                        x: -16,
                        opacity: 0,
                        duration: 0.45,
                        ease: 'expo.out',
                        stagger: 0.07,
                    },
                    '-=0.4'
                )
                .from(
                    root.querySelector('[data-telemetry-status]'),
                    {
                        scale: 0.6,
                        opacity: 0,
                        duration: 0.45,
                        ease: 'back.out(2)',
                    },
                    '-=0.5'
                )
                .from(
                    root.querySelectorAll('[data-feature-footer] > *'),
                    {
                        y: 8,
                        opacity: 0,
                        duration: 0.45,
                        ease: 'expo.out',
                        stagger: 0.08,
                    },
                    '-=0.3'
                )

            return registerReplay(() => {
                tl.restart(true, false)
            })
        },
        { scope: ref }
    )

    return (
        <div ref={ref} className="h-full">
            <FeatureBentoCard
                title="Deny-Only Cache Shield"
                description="Why saturate your databases checking blacklisted IPs? RateLock caches repeatedly blocked requests in local memory, instantly rejecting malicious spikes in `0.02ms` without making a single network call."
                icon="solar:shield-bold-duotone"
                iconColor="text-emerald-500"
                iconBgColor="bg-emerald-500/10"
                footerTags={['Bypasses database queries', 'Configurable TTL limits']}>
                <div
                    className="
                      mt-2 w-full space-y-3 rounded-2xl border border-border/40
                      bg-background/50 p-4 font-mono text-[10px] shadow-sm
                      select-none
                    ">
                    <div className="
                      flex items-center justify-between border-b
                      border-border/20 pb-2
                    ">
                        <span
                            className="
                              text-[8px] font-bold tracking-wider
                              text-muted-foreground/60 uppercase
                            ">
                            DoS mitigation active
                        </span>
                        <span
                            data-telemetry-status
                            className="
                              flex items-center gap-1 rounded-md border
                              border-emerald-500/20 bg-emerald-500/10 px-1.5
                              py-0.5 text-[8px] font-bold text-emerald-500
                            ">
                            <span className="
                              size-1 animate-pulse rounded-full bg-emerald-500
                            " />
                            Protected
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        <div data-telemetry-row className="flex justify-between">
                            <span className="text-muted-foreground">Blocked Request IP:</span>
                            <span className="font-mono font-bold text-red-500">
                                192.168.1.92
                            </span>
                        </div>
                        <div data-telemetry-row className="flex justify-between">
                            <span className="text-muted-foreground">Local Cache State:</span>
                            <span className="
                              font-mono font-bold text-emerald-500
                            ">
                                Cached (Deny)
                            </span>
                        </div>
                        <div data-telemetry-row className="flex justify-between">
                            <span className="text-muted-foreground">Database Query:</span>
                            <span className="
                              font-mono font-bold text-muted-foreground
                            ">
                                Bypassed (0 queries)
                            </span>
                        </div>
                        <div data-telemetry-row className="flex justify-between">
                            <span className="text-muted-foreground">Response Latency:</span>
                            <span className="
                              font-mono font-bold text-emerald-500
                            ">
                                0.02ms (Local)
                            </span>
                        </div>
                    </div>
                </div>
            </FeatureBentoCard>
        </div>
    )
}
