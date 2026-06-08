'use client'

import { useGSAP } from '@gsap/react'
import { Icon } from '@iconify/react'
import { useRef } from 'react'
import { BentoBase } from '../../components/bento-base'
import { gsap, registerGsap } from '../../_lib/gsap'

const CHECK_ITEMS = ['Type-safe imports', 'Zero logic edits', '100% testable core']

/**
 * The wide full-row "Swap backends seamlessly" tile.
 *
 * Motion narrative — two synchronized timelines tied to scroll:
 *
 *  - LEFT (copy): badge slides in, heading splits by word, body text
 *    fades up, then the three check items drop in one after another.
 *
 *  - RIGHT (code panels): the migration card slides in from below,
 *    the first snippet block clips in line by line, the arrow icon
 *    pulses, then the second snippet block reveals the same way —
 *    making the eye visually trace the migration path.
 *
 * The whole tile gets a subtle parallax: its inner code panels drift
 * slowly counter to the page scroll, adding depth without distraction.
 */
export function SwapBackendsTile() {
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
                y: 80,
                opacity: 0,
                filter: 'blur(10px)',
                duration: 1.1,
                ease: 'expo.out',
            })
                .from(
                    root.querySelector('[data-swap-badge]'),
                    {
                        y: 12,
                        opacity: 0,
                        duration: 0.5,
                        ease: 'expo.out',
                    },
                    '-=0.7'
                )
                .from(
                    root.querySelectorAll('[data-swap-headline-line]'),
                    {
                        yPercent: 110,
                        opacity: 0,
                        duration: 0.9,
                        ease: 'expo.out',
                        stagger: 0.12,
                    },
                    '-=0.4'
                )
                .from(
                    root.querySelector('[data-swap-desc]'),
                    {
                        y: 16,
                        opacity: 0,
                        duration: 0.6,
                        ease: 'expo.out',
                    },
                    '-=0.5'
                )
                .from(
                    root.querySelectorAll('[data-swap-check]'),
                    {
                        y: 12,
                        opacity: 0,
                        duration: 0.45,
                        ease: 'expo.out',
                        stagger: 0.09,
                    },
                    '-=0.4'
                )
                .from(
                    root.querySelector('[data-swap-codepanel]'),
                    {
                        xPercent: 6,
                        opacity: 0,
                        filter: 'blur(8px)',
                        duration: 0.95,
                        ease: 'expo.out',
                    },
                    '-=0.95'
                )
                .from(
                    root.querySelector('[data-swap-header]'),
                    {
                        y: 12,
                        opacity: 0,
                        duration: 0.45,
                        ease: 'expo.out',
                    },
                    '-=0.6'
                )
                .from(
                    root.querySelectorAll('[data-swap-step]'),
                    {
                        y: 18,
                        opacity: 0,
                        filter: 'blur(6px)',
                        duration: 0.7,
                        ease: 'expo.out',
                        stagger: 0.18,
                    },
                    '-=0.4'
                )
                .from(
                    root.querySelector('[data-swap-arrow]'),
                    {
                        scale: 0.4,
                        opacity: 0,
                        duration: 0.5,
                        ease: 'back.out(2)',
                    },
                    '-=0.55'
                )

            // Subtle parallax on the inner code panel
            const codePanel = root.querySelector('[data-swap-codepanel]')
            if (codePanel) {
                gsap.fromTo(
                    codePanel,
                    { y: 40 },
                    {
                        y: -40,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: root,
                            start: 'top bottom',
                            end: 'bottom top',
                            scrub: 0.8,
                        },
                    }
                )
            }
        },
        { scope: ref }
    )

    return (
        <div
            ref={ref}
            className="
              flex-1
              md:col-span-3
            ">
            <BentoBase className="grid items-center gap-10 md:grid-cols-2">
                <div>
                    <span
                        data-swap-badge
                        className="
                          inline-flex items-center gap-1.5 rounded-xl border
                          border-border/40 bg-background px-3 py-1 font-mono
                          text-[10px] font-bold tracking-wider
                          text-muted-foreground uppercase shadow-xs select-none
                        ">
                        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                        Unified Interface
                    </span>
                    <h3
                        className="
                          mt-6 font-heading text-2xl/tight font-bold tracking-tight
                          text-foreground
                          sm:text-3xl
                        ">
                        <span data-swap-headline-line className="block">
                            Swap backends seamlessly,
                        </span>
                        <span data-swap-headline-line className="block">
                            keeping code intact.
                        </span>
                    </h3>
                    <p
                        data-swap-desc
                        className="mt-4 max-w-md text-sm/relaxed text-muted-foreground">
                        RateLock encapsulates the host-specific database driver logic inside
                        the engine packages. Your core limiters, validation hooks, API
                        configurations, and resilience policies remain{' '}
                        <strong className="text-foreground">100% unchanged</strong>.
                    </p>
                    <div
                        className="
                          mt-8 flex flex-wrap gap-5 text-xs font-semibold
                          text-muted-foreground
                        ">
                        {CHECK_ITEMS.map(label => (
                            <div
                                key={label}
                                data-swap-check
                                className="flex items-center gap-1.5 select-none">
                                <Icon
                                    icon="lucide:check-circle-2"
                                    className="size-4 text-emerald-500"
                                />
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    data-swap-codepanel
                    className="
                      relative flex w-full flex-col gap-5 overflow-hidden
                      rounded-[1.5rem] border border-border/40 bg-background
                      p-6 font-mono text-[11px] leading-relaxed shadow-sm
                      select-none
                    ">
                    <div
                        data-swap-header
                        className="
                          flex items-center justify-between border-b border-border/20
                          pb-2 text-[10px] font-bold tracking-wider
                          text-muted-foreground/80 uppercase select-none
                        ">
                        <span>Zero-config Migration</span>
                        <span
                            className="
                              rounded-lg border border-emerald-500/30 bg-emerald-500/10
                              px-2 py-0.5 font-mono text-[8px] font-bold text-emerald-500
                              shadow-xs select-none
                            ">
                            No Code Changes
                        </span>
                    </div>

                    <div className="space-y-5">
                        <div data-swap-step className="space-y-2">
                            <div className="text-[10px] font-bold text-muted-foreground">
                                1. Development (Local Memory)
                            </div>
                            <div
                                className="
                                  overflow-auto rounded-2xl border border-border/40
                                  bg-muted/40 p-3.5 text-left shadow-xs
                                ">
                                <span className="text-red-400">import</span> &#123;
                                fixedWindow &#125;{' '}
                                <span className="text-red-400">from</span>{' '}
                                <span className="text-emerald-400">
                                    &apos;@ratelock/local&apos;
                                </span>
                                <br />
                                <span className="text-muted-foreground">
                                    // Works instantly in serverless edge/lambda functions
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-center select-none">
                            <div
                                data-swap-arrow
                                className="rounded-full border border-border/40 bg-muted/40 p-2">
                                <Icon
                                    icon="solar:alt-arrow-down-bold-duotone"
                                    className="size-5 animate-bounce text-primary"
                                />
                            </div>
                        </div>

                        <div data-swap-step className="space-y-2">
                            <div className="text-[10px] font-bold text-muted-foreground">
                                2. Production (Distributed Redis)
                            </div>
                            <div
                                className="
                                  overflow-auto rounded-2xl border border-border/40
                                  bg-muted/40 p-3.5 text-left shadow-xs
                                ">
                                <span className="text-red-400">import</span> &#123;
                                fixedWindow &#125;{' '}
                                <span className="text-red-400">from</span>{' '}
                                <span className="text-emerald-400">
                                    &apos;@ratelock/redis&apos;
                                </span>
                                <br />
                                <span className="text-muted-foreground">
                                    // Swaps engine underneath. Resilience wrappers remain
                                    identical!
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </BentoBase>
        </div>
    )
}
