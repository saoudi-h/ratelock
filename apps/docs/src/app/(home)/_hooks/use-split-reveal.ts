'use client'

import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import { gsap, registerGsap, SplitText } from '../_lib/gsap'

type SplitType = 'chars' | 'words' | 'lines' | 'chars,words' | 'words,lines'

interface SplitRevealOptions {
    /** Granularity of the split. Defaults to `words`. */
    type?: SplitType
    /** What to animate from. Accepts any GSAP TweenVars. */
    from?: gsap.TweenVars
    /** Stagger seconds between each piece. */
    stagger?: number
    /** Duration per piece. */
    duration?: number
    /** GSAP ease. Defaults to a strong outSnap. */
    ease?: string
    /** Delay before the reveal kicks off. */
    delay?: number
    /** If true, plays on scroll into view rather than on mount. */
    onScroll?: boolean
    /** ScrollTrigger start (when `onScroll`). */
    start?: string
    /** Only run once. Defaults to true. */
    once?: boolean
}

/**
 * Splits the element's text into chars/words/lines and reveals them in
 * cascade. Uses GSAP's official SplitText plugin with `autoSplit: true`
 * so it re-splits on resize without losing animation state.
 */
export function useSplitReveal<T extends HTMLElement = HTMLHeadingElement>({
    type = 'words',
    from = { y: 32, opacity: 0, filter: 'blur(8px)' },
    stagger = 0.05,
    duration = 0.9,
    ease = 'expo.out',
    delay = 0,
    onScroll = false,
    start = 'top 85%',
    once = true,
}: SplitRevealOptions = {}) {
    registerGsap()
    const ref = useRef<T | null>(null)

    useGSAP(
        () => {
            if (!ref.current) return

            const target = ref.current
            const targetKey = type.includes('lines')
                ? 'lines'
                : type.includes('chars')
                  ? 'chars'
                  : 'words'

            const split = SplitText.create(target, {
                type,
                autoSplit: true,
                mask: type.includes('lines') || type === 'lines' ? 'lines' : undefined,
                onSplit(self) {
                    const pieces = (self as unknown as Record<string, Element[]>)[targetKey]
                    if (!pieces?.length) return

                    gsap.from(pieces, {
                        ...from,
                        duration,
                        ease,
                        stagger,
                        delay,
                        scrollTrigger: onScroll
                            ? {
                                  trigger: target,
                                  start,
                                  once,
                              }
                            : undefined,
                    })
                },
            })

            return () => split.revert()
        },
        { dependencies: [type, stagger, duration, ease, delay, onScroll, start, once] }
    )

    return ref
}
