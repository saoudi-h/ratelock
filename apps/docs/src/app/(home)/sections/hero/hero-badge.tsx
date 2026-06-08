'use client'

import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import { gsap, registerGsap } from '../../_lib/gsap'

/**
 * The little "v0.2 · Open Source" pill at the top of the hero.
 * Animates with a small drop-in + pulse on mount.
 */
export function HeroBadge() {
    registerGsap()
    const ref = useRef<HTMLSpanElement>(null)

    useGSAP(
        () => {
            if (!ref.current) return
            const el = ref.current
            gsap.fromTo(
                el,
                { y: -8, opacity: 0, filter: 'blur(4px)' },
                {
                    y: 0,
                    opacity: 1,
                    filter: 'blur(0px)',
                    duration: 0.6,
                    ease: 'expo.out',
                    onStart: () => el.classList.remove('gsap-prep'),
                    onInterrupt: () =>
                        gsap.set(el, { y: 0, opacity: 1, clearProps: 'filter' }),
                }
            )
        },
        { scope: ref }
    )

    return (
        <span
            ref={ref}
            className="
              gsap-prep inline-flex items-center gap-2 rounded-xl
              border border-border/40 bg-card/50 px-3 py-1.5
              font-mono text-xs font-semibold text-muted-foreground
              shadow-xs select-none
            ">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            v0.2 • Open Source
        </span>
    )
}
