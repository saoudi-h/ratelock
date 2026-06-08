'use client'

import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import { FeatureBentoCard } from '../../components/feature-bento-card'
import { gsap, registerGsap } from '../../_lib/gsap'

/**
 * Card listing the two failure-handling stances (Fail-Open / Fail-Closed).
 *
 * Motion narrative: enters from the right (mirrors the deny-cache card's
 * entry from the left so the two 2-col cards balance). The two policy
 * sub-cards then flip in like dealt playing cards.
 */
export function ErrorPoliciesCard() {
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
                x: 60,
                opacity: 0,
                filter: 'blur(10px)',
                duration: 0.95,
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
                    root.querySelectorAll('[data-policy-row]'),
                    {
                        rotateX: -45,
                        yPercent: 30,
                        opacity: 0,
                        filter: 'blur(6px)',
                        transformOrigin: '50% 100% -10px',
                        duration: 0.75,
                        ease: 'expo.out',
                        stagger: 0.12,
                    },
                    '-=0.4'
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
        },
        { scope: ref }
    )

    return (
        <div ref={ref} className="[perspective:900px]">
            <FeatureBentoCard
                title="Adaptive Error Policies"
                description="Choose how to handle rate limiting exceptions during extreme database congestion or downtime. Swap behaviors dynamically without rewriting controller logics."
                icon="solar:tuning-square-bold-duotone"
                iconColor="text-sky-500"
                iconBgColor="bg-sky-500/10"
                colSpan="2"
                footerTags={['Granular retry policies', 'Fully custom error callbacks']}>
                <div className="mt-2 grid w-full gap-3">
                    <div
                        data-policy-row
                        className="
                          flex items-start gap-3 rounded-2xl border border-border/40
                          bg-background/40 p-3 shadow-xs transition-colors duration-300
                          select-none
                          hover:border-primary/20
                        ">
                        <div
                            className="
                              flex size-7 items-center justify-center rounded-xl
                              bg-emerald-500/10 font-mono text-xs font-bold
                              text-emerald-500 select-none
                            ">
                            O
                        </div>
                        <div>
                            <div className="font-heading text-xs font-bold text-foreground">
                                Fail-Open (Recommended)
                            </div>
                            <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                Bypasses database failures. Ensures legitimate customers are
                                never locked out of your application during downtime.
                            </div>
                        </div>
                    </div>
                    <div
                        data-policy-row
                        className="
                          flex items-start gap-3 rounded-2xl border border-border/40
                          bg-background/40 p-3 shadow-xs transition-colors duration-300
                          select-none
                          hover:border-primary/20
                        ">
                        <div
                            className="
                              flex size-7 items-center justify-center rounded-xl
                              bg-red-500/10 font-mono text-xs font-bold text-red-500
                              select-none
                            ">
                            C
                        </div>
                        <div>
                            <div className="font-heading text-xs font-bold text-foreground">
                                Fail-Closed
                            </div>
                            <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                Blocks all requests if rate limiting state is offline.
                                Prevents catastrophic security leakages during infrastructure
                                congestion.
                            </div>
                        </div>
                    </div>
                </div>
            </FeatureBentoCard>
        </div>
    )
}
