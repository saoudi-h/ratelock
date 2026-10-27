'use client'

import { useGSAP } from '@gsap/react'
import { useRef } from 'react'

import { gsap, registerGsap, ScrollTrigger } from '../../_lib/gsap'
import { registerReplay } from '../../_lib/replay-registry'

const firstLine = ['Rate', 'limiting.']

/**
 * The headline of the page. The entrance is pure CSS (`.hero-animate` in
 * `app.css`): the first line cascades word by word from a mask, the gradient
 * line fades in as a whole unit to preserve background-clip. Because it needs
 * no JavaScript, the title is painted with the first frame and is the LCP
 * candidate right away, instead of waiting for the bundle to load and hydrate.
 *
 * Once hydrated, the whole title gently drifts upward on scroll (parallax) so
 * the hero feels deep even before the user knows to look for it.
 */
export function HeroTitle() {
    registerGsap()
    const ref = useRef<HTMLHeadingElement>(null)

    useGSAP(
        () => {
            if (!ref.current) return
            const heading = ref.current

            ScrollTrigger.create({
                trigger: heading,
                start: 'top top+=80',
                end: 'bottom top',
                scrub: 0.4,
                animation: gsap.to(heading, {
                    yPercent: -25,
                    opacity: 0.4,
                    ease: 'none',
                }),
            })

            // bfcache replay: restart the CSS animation. The ScrollTrigger is
            // reverted by the useGSAP context on unmount.
            return registerReplay(() => {
                heading.classList.remove('hero-animate')
                void heading.offsetWidth
                heading.classList.add('hero-animate')
            })
        },
        { scope: ref }
    )

    return (
        <h1
            ref={ref}
            className="
              hero-animate font-heading text-5xl leading-[1.15] font-black tracking-tight
              perspective-midrange
              sm:text-6xl
              lg:text-7xl
              xl:text-7xl
            ">
            <span data-hero-line className="block text-foreground">
                {firstLine.map((word, index) => (
                    <span key={word} className="hero-word-mask">
                        <span className="hero-word" style={{ '--i': index } as React.CSSProperties}>
                            {word}
                        </span>{' '}
                    </span>
                ))}
            </span>
            <span
                data-gradient-line
                className="text-gradient hero-gradient-line inline-block pb-1.5">
                Done right.
            </span>
        </h1>
    )
}
