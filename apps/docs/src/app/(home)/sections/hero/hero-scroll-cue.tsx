'use client'

import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import { gsap, registerGsap } from '../../_lib/gsap'
import { registerReplay } from '../../_lib/replay-registry'

/**
 * Bottom-of-hero scroll cue. Pulses in once, then bobs gently to draw
 * the eye downward. Fades away as soon as the user scrolls past the
 * hero, so it never reappears.
 */
export function HeroScrollCue() {
    registerGsap()
    const ref = useRef<HTMLDivElement>(null)

    useGSAP(
        () => {
            if (!ref.current) return

            const wrap = ref.current
            const dot = wrap.querySelector<HTMLElement>('[data-scroll-dot]')

            const tl = gsap.timeline({ delay: 1.2 })
            tl.fromTo(
                wrap,
                { y: -8, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.6,
                    ease: 'expo.out',
                    onStart: () => wrap.classList.remove('gsap-prep'),
                    onInterrupt: () => {
                        gsap.set(wrap, { y: 0, opacity: 1 })
                        wrap.classList.remove('gsap-prep')
                    },
                }
            )
            if (dot) {
                tl.to(
                    dot,
                    {
                        y: 10,
                        duration: 1.1,
                        repeat: -1,
                        yoyo: true,
                        ease: 'sine.inOut',
                    },
                    '+=0.1'
                )
            }

            gsap.to(wrap, {
                opacity: 0,
                y: 24,
                scrollTrigger: {
                    trigger: wrap,
                    start: 'top 80%',
                    end: 'top 30%',
                    scrub: true,
                },
            })

            return registerReplay(() => {
                tl.restart(true, false)
            })
        },
        { scope: ref }
    )

    return (
        <div
            ref={ref}
            aria-hidden
            className="
              gsap-prep pointer-events-none flex flex-col items-center gap-2
              text-muted-foreground/70 select-none
            ">
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase">
                Scroll
            </span>
            <div
                className="
                  relative flex h-9 w-5 items-start justify-center rounded-full
                  border border-border/60 p-1
                ">
                <span
                    data-scroll-dot
                    className="size-1 rounded-full bg-foreground/60"
                />
            </div>
        </div>
    )
}
