'use client'

import { useGSAP } from '@gsap/react'
import { useRef } from 'react'

import { gsap, registerGsap } from '../../_lib/gsap'

export function BlogPostShell({ children }: { children: React.ReactNode }) {
    registerGsap()
    const ref = useRef<HTMLDivElement>(null)

    useGSAP(
        () => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

            const ctx = gsap.context(() => {
                gsap.from(['[data-post-title]', '[data-post-desc]'], {
                    y: 12,
                    opacity: 0,
                    duration: 0.6,
                    stagger: 0.08,
                    ease: 'expo.out',
                })
                gsap.from('[data-post-meta]', {
                    y: 8,
                    opacity: 0,
                    duration: 0.5,
                    delay: 0.14,
                    ease: 'expo.out',
                })
                gsap.from('[data-post-body]', {
                    y: 10,
                    opacity: 0,
                    duration: 0.6,
                    delay: 0.2,
                    ease: 'expo.out',
                })
            }, ref)

            return () => ctx.revert()
        },
        { scope: ref }
    )

    return <div ref={ref}>{children}</div>
}
