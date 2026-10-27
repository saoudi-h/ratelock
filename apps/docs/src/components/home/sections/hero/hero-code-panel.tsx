'use client'

import { useGSAP } from '@gsap/react'
import { useRef } from 'react'

import { restartCssAnimation } from '../../_lib/css-animation'
import { gsap, registerGsap } from '../../_lib/gsap'
import { registerReplay } from '../../_lib/replay-registry'
import { AnimatedCodePanel } from '../../components/animated-code-panel'

/**
 * Wraps the rotating code window with its own entrance: slides in from
 * the right with a subtle 3D rotation + drop shadow lift, then it
 * floats slightly with a constant parallax-style breathing motion.
 *
 * On scroll out, it tilts and drifts back to feel like depth instead
 * of just a flat plane sliding off.
 */
export function HeroCodePanel() {
    registerGsap()
    const ref = useRef<HTMLDivElement>(null)

    useGSAP(
        () => {
            if (!ref.current) return

            const panel = ref.current

            // Scroll-tied drift + slight rotate-out
            gsap.to(panel, {
                yPercent: -18,
                rotateX: 6,
                rotateY: -3,
                ease: 'none',
                scrollTrigger: {
                    trigger: panel,
                    start: 'top top+=120',
                    end: 'bottom top',
                    scrub: 0.5,
                },
            })

            return registerReplay(() => restartCssAnimation(panel))
        },
        { scope: ref }
    )

    return (
        <div
            className="
              relative flex w-full flex-col items-center justify-center perspective-distant
              lg:items-end
            ">
            <div
                ref={ref}
                className="
                  hero-animate hero-code-panel w-full max-w-125 transform-gpu transition-transform
                  duration-500 will-change-transform transform-3d
                  hover:scale-[1.02]
                  lg:max-w-none
                ">
                <AnimatedCodePanel />
            </div>
        </div>
    )
}
