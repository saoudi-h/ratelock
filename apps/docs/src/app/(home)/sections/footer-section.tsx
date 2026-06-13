'use client'

import { LogoLink } from '@/components/ui-blocks/logo'
import { useGSAP } from '@gsap/react'
import { registerReplay } from '../_lib/replay-registry'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { useRef } from 'react'
import { gsap, registerGsap } from '../_lib/gsap'

/**
 * Site-wide footer. Motion is intentionally restrained — a footer
 * shouldn't compete with the content above it. The whole block
 * fades and lifts in once, the four columns stagger a few px into
 * place, and the underline on each link draws on hover (CSS only).
 */
export function FooterSection() {
    registerGsap()
    const ref = useRef<HTMLElement>(null)

    useGSAP(
        () => {
            if (!ref.current) return
            const root = ref.current

            const tl = gsap.timeline()

            tl.from(root, {
                y: 30,
                opacity: 0,
                filter: 'blur(6px)',
                duration: 0.9,
                ease: 'expo.out',
                scrollTrigger: { trigger: root, start: 'top 95%', once: true },
            })

            tl.from(root.querySelectorAll('[data-footer-col]'), {
                y: 18,
                opacity: 0,
                duration: 0.6,
                ease: 'expo.out',
                stagger: 0.07,
                scrollTrigger: { trigger: root, start: 'top 95%', once: true },
                delay: 0.1,
            })

            return registerReplay(() => tl.restart(true, false))
        },
        { scope: ref }
    )

    return (
        <footer ref={ref} className="relative border-t border-border/40 bg-muted/20">
            <div className="mx-auto max-w-7xl px-6 py-16">
                <div
                    className="
                  grid grid-cols-1 items-start gap-10 border-b border-border/20
                  pb-12
                  md:grid-cols-4
                ">
                    <div data-footer-col className="space-y-4 md:col-span-2">
                        <div className="flex items-center gap-2.5 select-none">
                            <LogoLink />
                        </div>
                        <p className="max-w-sm text-xs/relaxed text-muted-foreground">
                            A highly precise, resilient rate limiting suite for TypeScript. Built to
                            scale gracefully with your local storage, Redis, or PostgreSQL backends.
                        </p>
                    </div>

                    <div data-footer-col className="space-y-4">
                        <div className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase select-none">
                            Documentation
                        </div>
                        <ul className="flex flex-col gap-3 text-xs">
                            {[
                                { href: '/docs', label: 'Getting Started' },
                                { href: '/docs/strategies', label: 'Rate Limiting Strategies' },
                                { href: '/docs/engines', label: 'Storage Engines' },
                                { href: '/docs/policies', label: 'Resilience Policies' },
                            ].map(link => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="
                                          group/link inline-flex
                                          text-muted-foreground transition-colors
                                          duration-200 hover:text-foreground
                                        ">
                                        <span className="relative">
                                            {link.label}
                                            <span
                                                className="
                                                  absolute right-0 -bottom-0.5 left-0
                                                  h-px origin-left scale-x-0
                                                  bg-foreground/40 transition-transform
                                                  duration-300
                                                  group-hover/link:scale-x-100
                                                "
                                            />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div data-footer-col className="space-y-4">
                        <div className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase select-none">
                            NPM Packages
                        </div>
                        <ul className="flex flex-col gap-3 font-mono text-xs">
                            {['@ratelock/local', '@ratelock/redis', '@ratelock/postgres'].map(pkg => (
                                <li key={pkg}>
                                    <a
                                        href={`https://www.npmjs.com/package/${pkg}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="
                                          group/link inline-flex items-center gap-1.5
                                          text-muted-foreground transition-colors
                                          duration-200 hover:text-foreground
                                        ">
                                        <Icon icon="logos:npm-icon" className="size-3.5" />
                                        <span className="relative">
                                            {pkg}
                                            <span
                                                className="
                                                  absolute right-0 -bottom-0.5 left-0
                                                  h-px origin-left scale-x-0
                                                  bg-foreground/40 transition-transform
                                                  duration-300
                                                  group-hover/link:scale-x-100
                                                "
                                            />
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div
                    data-footer-col
                    className="
                  mt-8 flex flex-col items-start justify-between gap-4
                  text-[11px] text-muted-foreground select-none
                  md:flex-row md:items-center
                ">
                    <div className="flex items-center gap-2">
                        <span>
                            MIT License • Copyright © {new Date().getFullYear()} Hakim Saoudi
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a
                            href="https://github.com/saoudi-h/ratelock"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                              group/link inline-flex items-center gap-1.5
                              text-muted-foreground transition-colors duration-200
                              hover:text-foreground
                            ">
                            <Icon icon="mdi:github" className="size-4" />
                            <span className="relative">
                                GitHub
                                <span
                                    className="
                                      absolute right-0 -bottom-0.5 left-0 h-px
                                      origin-left scale-x-0 bg-foreground/40
                                      transition-transform duration-300
                                      group-hover/link:scale-x-100
                                    "
                                />
                            </span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
