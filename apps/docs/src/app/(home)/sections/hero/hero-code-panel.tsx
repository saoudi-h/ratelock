'use client'

import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import { AnimatedCodePanel } from '../../components/animated-code-panel'
import { gsap, registerGsap } from '../../_lib/gsap'
import { registerReplay } from '../../_lib/replay-registry'

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

            // Entrance
            const entrance = gsap.fromTo(
                panel,
                {
                    xPercent: 6,
                    yPercent: 4,
                    rotateY: 12,
                    rotateX: -4,
                    opacity: 0,
                    filter: 'blur(10px)',
                },
                {
                    xPercent: 0,
                    yPercent: 0,
                    rotateY: 0,
                    rotateX: 0,
                    opacity: 1,
                    filter: 'blur(0px)',
                    duration: 1.2,
                    ease: 'expo.out',
                    delay: 0.35,
                    onStart: () => panel.classList.remove('gsap-prep'),
                    onInterrupt: () => {
                        gsap.set(panel, {
                            xPercent: 0,
                            yPercent: 0,
                            rotateY: 0,
                            rotateX: 0,
                            opacity: 1,
                            clearProps: 'filter',
                        })
                        panel.classList.remove('gsap-prep')
                    },
                }
            )

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

            return registerReplay(() => entrance.restart(true, false))
        },
        { scope: ref }
    )

    return (
        <div
            className="
              relative flex w-full flex-col items-center justify-center
              [perspective:1200px]
              lg:items-end
            ">
            <div
                ref={ref}
                className="
                  gsap-prep w-full max-w-125 transform-gpu transition-transform duration-500
                  will-change-transform
                  [transform-style:preserve-3d]
                  hover:scale-[1.02]
                  lg:max-w-none
                ">
                <AnimatedCodePanel />
            </div>
        </div>
    )
}
