'use client'

import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import { gsap, registerGsap } from '../_lib/gsap'

interface ScrollRevealOptions {
    /** Initial vars (gsap.from). */
    from?: gsap.TweenVars
    /** Stagger between immediate children. Pass `0` to disable. */
    stagger?: number
    /** Selector for children to stagger. Default: direct children. */
    childrenSelector?: string
    /** Duration per child / target. */
    duration?: number
    /** GSAP ease. */
    ease?: string
    /** Delay seconds. */
    delay?: number
    /** ScrollTrigger start. */
    start?: string
    /** ScrollTrigger end. */
    end?: string
    /** If true, animates only once. */
    once?: boolean
    /** Scrub seconds. If set, ties tween to scroll position. */
    scrub?: number | boolean
}

/**
 * Generic scroll-in reveal that runs an animation when the element
 * enters the viewport. Animates the children of the scoped element by
 * default (works well with bento grids).
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>({
    from = { y: 40, opacity: 0, filter: 'blur(6px)' },
    stagger = 0.08,
    childrenSelector = ':scope > *',
    duration = 0.9,
    ease = 'expo.out',
    delay = 0,
    start = 'top 80%',
    end,
    once = true,
    scrub,
}: ScrollRevealOptions = {}) {
    registerGsap()
    const ref = useRef<T | null>(null)

    useGSAP(
        () => {
            if (!ref.current) return
            const root = ref.current
            const targets =
                stagger > 0
                    ? Array.from(root.querySelectorAll<HTMLElement>(childrenSelector))
                    : [root]
            if (!targets.length) return

            const tween = gsap.from(targets, {
                ...from,
                duration,
                ease,
                stagger,
                delay,
                scrollTrigger: {
                    trigger: root,
                    start,
                    end,
                    scrub: scrub ?? false,
                    toggleActions: once ? 'play none none none' : 'play none none reverse',
                    once,
                },
            })

            return () => {
                tween.scrollTrigger?.kill()
                tween.kill()
            }
        },
        {
            dependencies: [
                stagger,
                childrenSelector,
                duration,
                ease,
                delay,
                start,
                end,
                once,
                scrub,
            ],
        }
    )

    return ref
}
