'use client'

import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import { FeatureBentoCard } from '../../components/feature-bento-card'
import { gsap, registerGsap } from '../../_lib/gsap'

/**
 * Card showing the fallback-policy config snippet.
 *
 * Motion narrative: enters with a tiny upward push + scale, then the
 * snippet types itself in line by line (using a clip-path mask animated
 * downward) — feels like the code is being authored in real time.
 */
export function FallbackPoliciesCard() {
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
                scale: 0.96,
                opacity: 0,
                filter: 'blur(8px)',
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
                    root.querySelector('[data-code-snippet]'),
                    {
                        clipPath: 'inset(0 0 100% 0)',
                        duration: 0.9,
                        ease: 'expo.inOut',
                    },
                    '-=0.3'
                )
                .from(
                    root.querySelectorAll('[data-code-line]'),
                    {
                        opacity: 0,
                        duration: 0.3,
                        stagger: 0.06,
                        ease: 'power1.out',
                    },
                    '<+=0.05'
                )
        },
        { scope: ref }
    )

    return (
        <div ref={ref}>
            <FeatureBentoCard
                title="Fallback Policies"
                description="Configure your limiters with custom fallback policies to guarantee that rate limit operations never throw runtime exceptions to clients during database hiccups."
                icon="solar:programming-bold-duotone"
                iconColor="text-purple-500"
                iconBgColor="bg-purple-500/10">
                <div
                    data-code-snippet
                    className="
                      mt-6 space-y-1.5 overflow-x-auto rounded-2xl border
                      border-border/40 bg-background/50 p-5 text-left font-mono
                      text-[10px] leading-relaxed shadow-sm select-none
                    ">
                    <div data-code-line>
                        <span className="text-purple-400">const</span> limiter ={' '}
                        <span className="text-blue-400">await</span>{' '}
                        <span className="text-emerald-400">fixedWindow</span>(&#123;
                    </div>
                    <div data-code-line className="pl-3">
                        limit: <span className="text-yellow-400">100</span>,
                    </div>
                    <div data-code-line className="pl-3">
                        windowMs: <span className="text-yellow-400">60_000</span>,
                    </div>
                    <div data-code-line className="pl-3">
                        <span className="text-purple-400">fallback</span>:{' '}
                        <span className="text-emerald-300">&apos;allow&apos;</span>,{' '}
                        <span className="text-muted-foreground">// Fail-open</span>
                    </div>
                    <div data-code-line>&#125;)</div>
                </div>
            </FeatureBentoCard>
        </div>
    )
}
