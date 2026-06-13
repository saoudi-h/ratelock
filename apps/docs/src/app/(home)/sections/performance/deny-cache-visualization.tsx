'use client'

import { useGSAP } from '@gsap/react'
import { registerReplay } from '../../_lib/replay-registry'
import { Icon } from '@iconify/react'
import { useEffect, useRef, useState } from 'react'
import { BentoBase } from '../../components/bento-base'
import { gsap, registerGsap } from '../../_lib/gsap'
import { DenyCacheParticle } from './deny-cache-particle'

/**
 * Right card: visualizes how the deny cache shields the DB from spam.
 *
 * Motion narrative:
 *   - Card enters with a fade + lift on first scroll into view
 *   - Client / shield / DB icons drop into place in a staged drop
 *   - The shield pill scales in last with a back-out ease (gives it
 *     the "snap-on" feel of an active shield)
 *   - Background particle flow toggles between two states every 3s,
 *     animated via CSS for performance
 *   - The headline "X ops/s" number tweens up from 0 to its real
 *     value on first reveal — gives a tangible "wow" payoff
 */
export function DenyCacheVisualization() {
    registerGsap()
    const ref = useRef<HTMLDivElement>(null)
    const opsRef = useRef<HTMLSpanElement>(null)
    const [denyCacheFlooded, setDenyCacheFlooded] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            setDenyCacheFlooded(prev => !prev)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

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
                    root.querySelectorAll('[data-deny-eyebrow], [data-deny-title], [data-deny-desc]'),
                    {
                        y: 14,
                        opacity: 0,
                        duration: 0.55,
                        ease: 'expo.out',
                        stagger: 0.08,
                    },
                    '-=0.6'
                )
                .from(
                    root.querySelector('[data-deny-diagram]'),
                    {
                        y: 16,
                        opacity: 0,
                        filter: 'blur(6px)',
                        duration: 0.7,
                        ease: 'expo.out',
                    },
                    '-=0.4'
                )
                .from(
                    root.querySelector('[data-deny-client]'),
                    { y: -12, opacity: 0, duration: 0.4, ease: 'expo.out' },
                    '-=0.4'
                )
                .from(
                    root.querySelector('[data-deny-db]'),
                    { y: 12, opacity: 0, duration: 0.4, ease: 'expo.out' },
                    '<'
                )
                .fromTo(
                    root.querySelector('[data-deny-shield]'),
                    { scale: 0.4, opacity: 0 },
                    {
                        scale: 1,
                        opacity: 1,
                        duration: 0.55,
                        ease: 'back.out(2)',
                    },
                    '-=0.2'
                )
                .from(
                    root.querySelectorAll('[data-deny-stat]'),
                    {
                        y: 14,
                        opacity: 0,
                        duration: 0.5,
                        ease: 'expo.out',
                        stagger: 0.1,
                    },
                    '-=0.4'
                )

            // Headline ops/s number counts up
            let counterTween: gsap.core.Tween | undefined
            if (opsRef.current) {
                const target = 2418094
                const counter = { val: 0 }
                counterTween = gsap.to(counter, {
                    val: target,
                    duration: 1.6,
                    ease: 'expo.out',
                    delay: 0.9,
                    scrollTrigger: { trigger: root, start: 'top 80%', once: true },
                    onUpdate: () => {
                        if (opsRef.current) {
                            opsRef.current.textContent =
                                Math.round(counter.val).toLocaleString() + ' ops/s'
                        }
                    },
                })
            }

            return registerReplay(() => {
                tl.restart(true, false)
                counterTween?.restart(true, false)
            })
        },
        { scope: ref }
    )

    return (
        <div
            ref={ref}
            className="
              flex flex-col justify-between h-full
              lg:col-span-5
            ">
            <BentoBase className="gap-8 h-full">
                <div>
                    <span
                        data-deny-eyebrow
                        className="
                          inline-flex items-center gap-1.5 rounded-xl border
                          border-border/40 bg-background px-3 py-1 font-mono
                          text-[10px] font-bold tracking-wider
                          text-muted-foreground uppercase shadow-xs select-none
                        ">
                        <span
                            className={`
                              size-1.5 animate-pulse rounded-full
                              ${denyCacheFlooded ? 'bg-emerald-500' : 'bg-red-500'}
                            `}
                        />
                        {denyCacheFlooded
                            ? 'Shield Active (Spam Blocked)'
                            : 'Shield Inactive (DB Hit)'}
                    </span>
                    <h3
                        data-deny-title
                        className="mt-3 font-heading text-xl font-bold text-foreground">
                        Spam Protection with Deny Cache
                    </h3>
                    <p
                        data-deny-desc
                        className="mt-2 text-xs/relaxed text-muted-foreground">
                        The <code>withCache</code> decorator stores blocked keys in a local,
                        short-lived cache. Subsequent requests fail immediately in memory,
                        preventing network round-trips to your database.
                    </p>
                </div>

                <div
                    data-deny-diagram
                    className="
                      relative flex h-48 w-full flex-col items-center justify-center
                      overflow-hidden rounded-3xl border border-border/40 bg-muted/40
                      p-4 font-mono text-[10px] shadow-inner select-none
                    ">
                    <div
                        data-deny-client
                        className="absolute top-6 flex flex-col items-center gap-1">
                        <Icon icon="solar:user-bold-duotone" className="size-6 text-zinc-500" />
                        <span className="text-[8px] font-bold tracking-widest text-zinc-400 uppercase">
                            Spam Client
                        </span>
                    </div>

                    <div
                        data-deny-db
                        className="absolute bottom-6 z-10 flex flex-col items-center gap-1">
                        <Icon
                            icon="solar:database-bold-duotone"
                            className={`size-6 transition-colors duration-300 ${
                                denyCacheFlooded
                                    ? 'text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)] filter'
                                    : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)] filter'
                            }`}
                        />
                        <span
                            className={`text-[8px] font-bold tracking-widest uppercase transition-colors duration-300 ${
                                denyCacheFlooded
                                    ? 'text-emerald-500'
                                    : 'font-extrabold text-red-500'
                            }`}>
                            Database Server
                        </span>
                    </div>

                    <div className="absolute inset-y-0 w-0.5 bg-border/20" />

                    <div
                        data-deny-shield
                        className={`
                          absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-2
                          rounded-2xl border bg-background/90 px-4 py-2 shadow-sm
                          transition-colors duration-300 opacity-100
                          ${
                              denyCacheFlooded
                                  ? 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400'
                                  : 'border-zinc-800 bg-zinc-900/20 text-zinc-500'
                          }
                        `}>
                        <Icon
                            icon="solar:shield-bold-duotone"
                            className={`size-4 transition-colors duration-300 ${
                                denyCacheFlooded ? 'text-emerald-500' : 'text-zinc-600'
                            }`}
                        />
                        <span className="text-[9px] font-bold tracking-wider uppercase">
                            Deny Cache
                        </span>
                    </div>

                    <div
                        className="
                          pointer-events-none absolute inset-y-[36px] left-1/2 w-10
                          -translate-x-1/2 overflow-hidden
                        ">
                        <div
                            key={denyCacheFlooded ? 'shielded-flow' : 'direct-flow'}
                            className="absolute inset-0">
                            <DenyCacheParticle
                                color="emerald"
                                delay="0s"
                                end="100%"
                                offset="0px"
                            />
                            <DenyCacheParticle
                                color="red"
                                delay="0.45s"
                                duration={denyCacheFlooded ? '0.58s' : '1.05s'}
                                end={denyCacheFlooded ? '50%' : '100%'}
                                offset="-7px"
                            />
                            <DenyCacheParticle
                                color="red"
                                delay="0.95s"
                                duration={denyCacheFlooded ? '0.58s' : '1.05s'}
                                end={denyCacheFlooded ? '50%' : '100%'}
                                offset="7px"
                            />
                            <DenyCacheParticle
                                color="red"
                                delay="1.45s"
                                duration={denyCacheFlooded ? '0.58s' : '1.05s'}
                                end={denyCacheFlooded ? '50%' : '100%'}
                                offset="0px"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div
                        data-deny-stat
                        className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Without Cache (DB Hits):</span>
                        <span className="font-mono text-muted-foreground">~1,200 ops/s</span>
                    </div>
                    <div
                        data-deny-stat
                        className="flex items-center justify-between text-xs font-bold text-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            With Deny Cache (Shielded):
                        </span>
                        <span ref={opsRef} className="font-mono text-emerald-500">
                            0 ops/s
                        </span>
                    </div>
                </div>
            </BentoBase>
        </div>
    )
}
