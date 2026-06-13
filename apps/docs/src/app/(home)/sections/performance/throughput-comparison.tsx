'use client'

import { useGSAP } from '@gsap/react'
import { registerReplay } from '../../_lib/replay-registry'
import { Icon } from '@iconify/react'
import { useRef, useState } from 'react'
import { BentoBase } from '../../components/bento-base'
import { gsap, registerGsap } from '../../_lib/gsap'
import { BACKEND_DATA, type BackendType } from './data'

/**
 * Left card of the performance bento: throughput bar comparison with a
 * tabbed backend selector.
 *
 * Motion narrative:
 *   - Card slides up + fades in on first scroll into view
 *   - The selector pill bar morphs in from the right
 *   - Bars fill from 0 → target width using a smooth out-expo curve
 *   - On backend tab change, bars reset and re-fill (snappier)
 *   - Footer commentary fades in last
 */
export function ThroughputComparison() {
    registerGsap()
    const [activeBackend, setActiveBackend] = useState<BackendType>('memory')
    const ref = useRef<HTMLDivElement>(null)
    const barsRef = useRef<HTMLDivElement>(null)

    const current = BACKEND_DATA[activeBackend]
    const maxThroughput = Math.max(...current.metrics.map(m => m.throughput))

    // First-mount entrance
    useGSAP(
        () => {
            if (!ref.current) return
            const root = ref.current

            const tl = gsap.timeline({
                scrollTrigger: { trigger: root, start: 'top 80%', once: true },
            })

            tl.from(root, {
                y: 70,
                opacity: 0,
                filter: 'blur(10px)',
                duration: 1,
                ease: 'expo.out',
            })
                .from(
                    root.querySelector('[data-throughput-eyebrow]'),
                    { y: 12, opacity: 0, duration: 0.5, ease: 'expo.out' },
                    '-=0.55'
                )
                .from(
                    root.querySelector('[data-throughput-title]'),
                    { y: 14, opacity: 0, duration: 0.55, ease: 'expo.out' },
                    '-=0.4'
                )
                .from(
                    root.querySelector('[data-throughput-tabs]'),
                    { x: 30, opacity: 0, duration: 0.6, ease: 'expo.out' },
                    '-=0.55'
                )
                .from(
                    root.querySelector('[data-throughput-footer]'),
                    { y: 14, opacity: 0, duration: 0.55, ease: 'expo.out' },
                    '-=0.2'
                )

            return registerReplay(() => tl.restart(true, false))
        },
        { scope: ref }
    )

    // Re-animate bars whenever backend changes (and on first paint)
    useGSAP(
        () => {
            if (!barsRef.current) return
            const labels = barsRef.current.querySelectorAll<HTMLElement>('[data-bar-label]')
            const fills = barsRef.current.querySelectorAll<HTMLElement>('[data-bar-fill]')

            gsap.fromTo(
                labels,
                { y: 8, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, ease: 'expo.out', stagger: 0.08 }
            )

            fills.forEach((fill, i) => {
                const pct = Number(fill.dataset.target ?? 0)
                gsap.fromTo(
                    fill,
                    { width: '0%' },
                    {
                        width: `${pct}%`,
                        duration: 1.1,
                        ease: 'expo.out',
                        delay: 0.12 + i * 0.1,
                    }
                )
            })
        },
        { dependencies: [activeBackend] }
    )

    return (
        <div
            ref={ref}
            className="
              flex flex-col justify-between h-full
              lg:col-span-7
            ">
            <BentoBase className="gap-8 h-full">
                <div
                    className="
                      flex flex-col gap-4
                      sm:flex-row sm:items-center sm:justify-between
                    ">
                    <div>
                        <span
                            data-throughput-eyebrow
                            className="
                              inline-flex items-center gap-1.5 rounded-xl border
                              border-border/40 bg-background px-3 py-1 font-mono
                              text-[10px] font-bold tracking-wider
                              text-muted-foreground uppercase shadow-xs select-none
                            ">
                            Compare Backends
                        </span>
                        <h3
                            data-throughput-title
                            className="mt-3 font-heading text-xl font-bold text-foreground">
                            Throughput Comparison
                        </h3>
                    </div>

                    <div
                        data-throughput-tabs
                        className="
                          flex rounded-xl border border-border/40 bg-muted/40 p-1
                          shadow-xs
                        ">
                        {(['memory', 'redis', 'postgres'] as BackendType[]).map(type => (
                            <button
                                key={type}
                                onClick={() => setActiveBackend(type)}
                                className={`
                                  relative cursor-pointer rounded-lg px-3.5 py-1.5
                                  text-xs font-semibold tracking-wider uppercase
                                  transition-all duration-200 select-none
                                  active:scale-[0.97]
                                  ${
                                      activeBackend === type
                                          ? 'bg-background text-foreground shadow-xs'
                                          : 'text-muted-foreground hover:text-foreground'
                                  }
                                `}>
                                {type === 'memory'
                                    ? 'Memory'
                                    : type === 'redis'
                                      ? 'Redis'
                                      : 'Postgres'}
                            </button>
                        ))}
                    </div>
                </div>

                <div
                    ref={barsRef}
                    key={activeBackend}
                    className="flex flex-1 flex-col justify-center space-y-6">
                    {current.metrics.map(metric => {
                        const pct = (metric.throughput / maxThroughput) * 100
                        return (
                            <div key={metric.name} className="space-y-2">
                                <div
                                    data-bar-label
                                    className="flex items-center justify-between text-xs font-semibold">
                                    <span
                                        className={`
                                          flex items-center gap-1.5
                                          ${
                                              metric.isRateLock
                                                  ? 'font-bold text-foreground'
                                                  : 'text-muted-foreground'
                                          }
                                        `}>
                                        {metric.isRateLock && (
                                            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                                        )}
                                        {metric.name}
                                    </span>
                                    <span className="font-mono text-muted-foreground">
                                        {metric.throughput.toLocaleString()} ops/s •{' '}
                                        {metric.latency}
                                    </span>
                                </div>
                                <div
                                    className="
                                      relative h-8 w-full overflow-hidden rounded-2xl
                                      border border-border/20 bg-muted/20 p-1
                                    ">
                                    <div
                                        data-bar-fill
                                        data-target={pct}
                                        className={`
                                          h-full rounded-xl bg-gradient-to-r shadow-sm
                                          ${metric.color}
                                        `}
                                        style={{ width: 0 }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div
                    data-throughput-footer
                    className="
                      flex flex-col gap-3 rounded-2xl border border-border/20
                      bg-muted/20 p-4 text-xs/relaxed text-muted-foreground
                      sm:flex-row sm:items-center sm:justify-between
                    ">
                    <div className="flex items-center gap-2">
                        <Icon
                            icon="lucide:arrow-up-right"
                            className="size-4 text-emerald-500"
                        />
                        <span>
                            RateLock throughput is{' '}
                            <strong className="text-foreground">{current.multiplier}</strong>{' '}
                            higher under this workload.
                        </span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground/60 select-none">
                        Matrix 4 Baseline • 80 Concurrency • Reference Hardware (AMD Ryzen 7
                        5800X, 32GB RAM)
                    </span>
                </div>
            </BentoBase>
        </div>
    )
}
