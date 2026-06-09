'use client'

import { useGSAP } from '@gsap/react'
import Link from 'next/link'
import { useRef } from 'react'
import { gsap, registerGsap, SplitText } from '../../_lib/gsap'

/**
 * Wide CTA row at the bottom of the performance section. The piece
 * that invites the reader to dig into the actual benchmarks.
 *
 * Motion narrative:
 *   - Container slides up + fades on scroll into view
 *   - The headline word "benchmarks" is split (chars) and staggers
 *     upward with a soft "easeDrawer" curve (overshoots slightly
 *     and settles) — gives a tactile "click" to the wording
 *   - The link's underline draws from 0 → 100% on hover
 *   - The icon arrow nudges to the right on hover
 */
export function ExploreCta() {
    registerGsap()
    const ref = useRef<HTMLDivElement>(null)
    const titleRef = useRef<HTMLHeadingElement>(null)

    useGSAP(
        () => {
            if (!ref.current) return
            const root = ref.current

            gsap.from(root, {
                y: 60,
                opacity: 0,
                filter: 'blur(8px)',
                duration: 1,
                ease: 'expo.out',
                scrollTrigger: { trigger: root, start: 'top 90%', once: true },
            })

            if (titleRef.current) {
                const split = SplitText.create(titleRef.current, {
                    type: 'chars',
                    autoSplit: true,
                    onSplit: self => {
                        gsap.from(self.chars, {
                            yPercent: 110,
                            opacity: 0,
                            rotation: 6,
                            duration: 0.55,
                            ease: 'expo.out',
                            stagger: 0.018,
                            scrollTrigger: {
                                trigger: root,
                                start: 'top 90%',
                                once: true,
                            },
                        })
                    },
                })

                return () => {
                    split.revert()
                }
            }
        },
        { scope: ref }
    )

    return (
        <div
            ref={ref}
            className="
              group flex flex-col items-start justify-between gap-6
              rounded-4xl border border-border/30 bg-muted/20 p-8
              transition-colors duration-300
              hover:border-border/60 hover:bg-muted/30
              sm:flex-row sm:items-center
            ">
            <div>
                <span
                    className="
                      inline-flex items-center gap-1.5 rounded-xl border
                      border-border/40 bg-background px-3 py-1 font-mono
                      text-[10px] font-bold tracking-wider
                      text-muted-foreground uppercase shadow-xs select-none
                    ">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Verified Results
                </span>
                <h3
                    ref={titleRef}
                    className="
                      mt-3 font-heading text-2xl font-bold text-foreground
                      sm:text-3xl
                    ">
                    See the full benchmarks
                </h3>
                <p className="mt-2 max-w-xl text-sm/relaxed text-muted-foreground">
                    Explore latency, throughput and memory profiles for every backend
                    shipped with RateLock, plus the exact scripts we used to measure them.
                </p>
            </div>

            <Link
                href="/docs/benchmarks"
                className="
                  group/link inline-flex items-center gap-2 rounded-2xl
                  border border-border/40 bg-background px-5 py-2.5 text-sm
                  font-semibold text-foreground shadow-xs
                  transition-all duration-200
                  hover:bg-muted/50 active:scale-[0.97]
                ">
                <span>Open benchmarks</span>
                <svg
                    viewBox="0 0 16 16"
                    className="
                      size-4 transition-transform duration-200
                      group-hover/link:translate-x-0.5
                    "
                    aria-hidden>
                    <path
                        d="M4 8h8M8 4l4 4-4 4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </Link>
        </div>
    )
}
