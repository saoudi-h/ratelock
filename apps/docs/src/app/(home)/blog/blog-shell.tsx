'use client'

import { useGSAP } from '@gsap/react'
import { useEffect, useRef } from 'react'

import { gsap, registerGsap, ScrollTrigger } from '../_lib/gsap'

export function BlogShell({
    children,
    layoutKey,
}: {
    children: React.ReactNode
    layoutKey: string
}) {
    registerGsap()
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            ScrollTrigger.refresh()
        })

        return () => cancelAnimationFrame(frame)
    }, [layoutKey])

    useGSAP(
        () => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

            const ctx = gsap.context(() => {
                gsap.from('[data-blog-hero-title]', {
                    y: 14,
                    opacity: 0,
                    duration: 0.6,
                    ease: 'expo.out',
                })
                gsap.from('[data-blog-hero-desc]', {
                    y: 10,
                    opacity: 0,
                    duration: 0.6,
                    delay: 0.08,
                    ease: 'expo.out',
                })
                gsap.from('[data-blog-hero-meta]', {
                    y: 8,
                    opacity: 0,
                    duration: 0.5,
                    delay: 0.14,
                    ease: 'expo.out',
                })
                gsap.from('[data-blog-filter] a', {
                    y: 6,
                    opacity: 0,
                    duration: 0.4,
                    stagger: 0.04,
                    delay: 0.18,
                    ease: 'expo.out',
                })
                gsap.from('[data-blog-featured]', {
                    y: 16,
                    opacity: 0,
                    duration: 0.6,
                    delay: 0.22,
                    ease: 'expo.out',
                })
                gsap.from('[data-blog-card]', {
                    y: 12,
                    opacity: 0,
                    duration: 0.5,
                    stagger: 0.07,
                    ease: 'expo.out',
                    scrollTrigger: {
                        trigger: '[data-blog-grid]',
                        start: 'top 88%',
                    },
                })
            }, ref)

            return () => ctx.revert()
        },
        { scope: ref }
    )

    return <div ref={ref}>{children}</div>
}
