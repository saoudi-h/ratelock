'use client'

import { useEffect, useRef } from 'react'

import { restartCssAnimation } from '../../_lib/css-animation'
import { registerReplay } from '../../_lib/replay-registry'
import { BentoBase } from '../../components/bento-base'

interface Stat {
    value: string
    label: string
    desc: string
}

const STATS: Stat[] = [
    {
        value: '4',
        label: 'Strategies',
        desc: 'Fixed Window, Sliding Window, Token Bucket and Individual Fixed Window.',
    },
    {
        value: '4',
        label: 'Storage Engines',
        desc: 'Memory, Redis, Upstash Redis, PostgreSQL',
    },
    {
        value: 'Atomic',
        label: 'Operations',
        desc: 'Concurrency-safe updates with consistent rate limit enforcement.',
    },
    {
        value: 'Built-in',
        label: 'Resilience',
        desc: 'Retries, circuit breakers and fallback policies out of the box.',
    },
]

/**
 * The four-stat row at the bottom of the hero.
 *
 * Each card has its own scripted entrance, written in CSS (see `.hero-stats`
 * in `app.css`) so it costs no JavaScript at hydration:
 *   - cards rise from below with a tiny stagger
 *   - the big value glyphs fall in one character at a time
 *   - meta text fades and slides up after the value lands
 */
export function HeroStats() {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const wrap = ref.current
        if (!wrap) return
        return registerReplay(() => restartCssAnimation(wrap))
    }, [])

    return (
        <div
            ref={ref}
            className="
              hero-animate hero-stats grid grid-cols-2 gap-3 perspective-[1000px]
              sm:gap-4
              lg:grid-cols-4 lg:gap-4
            ">
            {STATS.map(stat => {
                const isLong = stat.value.length > 6
                const fontSize = isLong
                    ? 'text-2xl sm:text-3xl md:text-4xl'
                    : 'text-4xl md:text-5xl'
                return (
                    <BentoBase
                        key={stat.label}
                        wrapperClassName=""
                        density="compact"
                        data-stat-card>
                        <div
                            data-stat-value
                            className={`
                              font-heading leading-none font-black tracking-tighter
                              text-foreground/50 transition-colors duration-200 text-shadow-xs
                              group-hover:text-primary/80
                              ${fontSize}
                            `}>
                            <span aria-hidden>
                                {[...stat.value].map((char, charIndex) => (
                                    <span
                                        key={charIndex}
                                        className="hero-stat-char"
                                        style={{ '--i': charIndex } as React.CSSProperties}>
                                        {char}
                                    </span>
                                ))}
                            </span>
                            <span className="sr-only">{stat.value}</span>
                        </div>
                        <div className="mt-4 pt-3">
                            <div
                                data-stat-label
                                className="
                                  text-[11px] font-bold tracking-wider text-muted-foreground
                                  uppercase
                                ">
                                {stat.label}
                            </div>
                            <div
                                data-stat-desc
                                className="
                                  mt-1 text-[10.5px] leading-normal font-medium
                                  text-muted-foreground/70
                                ">
                                {stat.desc}
                            </div>
                        </div>
                    </BentoBase>
                )
            })}
        </div>
    )
}
