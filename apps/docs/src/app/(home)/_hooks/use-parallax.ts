'use client'

import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import { gsap, registerGsap, ScrollTrigger } from '../_lib/gsap'

type ParallaxAxis = 'y' | 'x'

interface ParallaxOptions {
    /** Distance in pixels travelled across the trigger window. Positive = move down. */
    distance?: number
    /** Axis to translate. */
    axis?: ParallaxAxis
    /** Scrub smoothing in seconds. */
    scrub?: number | boolean
    /** Start position (GSAP ScrollTrigger syntax). */
    start?: string
    /** End position (GSAP ScrollTrigger syntax). */
    end?: string
    /** Trigger element. Defaults to the element itself. */
    trigger?: React.RefObject<HTMLElement | null>
    /** Disable on small screens to save battery. */
    disableBelow?: number
}

/**
 * Returns a ref to attach to the element that should drift while its
 * container is in view. Distance is interpreted in raw pixels — keep
 * it small (-120..120) to feel like depth not motion sickness.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>({
    distance = -80,
    axis = 'y',
    scrub = 0.6,
    start = 'top bottom',
    end = 'bottom top',
    trigger,
    disableBelow = 640,
}: ParallaxOptions = {}) {
    registerGsap()
    const ref = useRef<T | null>(null)

    useGSAP(
        () => {
            if (!ref.current) return
            if (typeof window !== 'undefined' && window.innerWidth < disableBelow) return

            const target = ref.current
            const triggerEl = trigger?.current ?? target

            const tween = gsap.fromTo(
                target,
                { [axis]: 0 },
                {
                    [axis]: distance,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: triggerEl,
                        start,
                        end,
                        scrub,
                        invalidateOnRefresh: true,
                    },
                }
            )

            return () => {
                tween.scrollTrigger?.kill()
                tween.kill()
            }
        },
        { dependencies: [distance, axis, scrub, start, end, disableBelow] }
    )

    return ref
}

export { ScrollTrigger }
