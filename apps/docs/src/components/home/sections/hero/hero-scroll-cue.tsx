'use client'

import { useGSAP } from '@gsap/react'
import { useRef } from 'react'

import { restartCssAnimation } from '../../_lib/css-animation'
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

            return registerReplay(() => restartCssAnimation(wrap))
        },
        { scope: ref }
    )

    return (
        <div
            ref={ref}
            aria-hidden
            className="
              hero-animate hero-scroll-cue pointer-events-none flex flex-col items-center gap-2
              text-muted-foreground/70 select-none
            ">
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase">Scroll</span>
            <div
                className="
                  relative flex h-9 w-5 items-start justify-center rounded-full border
                  border-border/60 p-1
                ">
                <span
                    data-scroll-dot
                    className="hero-scroll-dot size-1 rounded-full bg-foreground/60"
                />
            </div>
        </div>
    )
}
