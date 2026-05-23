'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { ArrowRightBold } from '@solar-icons/react-perf'
import { AnimatedCodePanel } from '../components/animated-code-panel'

export function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-background">
            {/* Ambient Glowing Gradient Mesh Background */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,var(--primary)/12%,transparent_40%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,oklch(0.82_0.16_80)/6%,transparent_45%)]" />

            <div
                className="pattern-grid pointer-events-none absolute inset-0"
                style={{
                    maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)',
                }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_70%_30%,var(--primary)/6%,transparent)]" />

            <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="mb-6"
                        >
                            <span className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                                <span className="size-1.5 rounded-full bg-primary" />
                                v0.2, Open Source
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="font-heading text-6xl leading-[0.95] font-black tracking-tight md:text-7xl lg:text-8xl"
                        >
                            <span className="text-foreground">Rate limiting, </span>
                            <span className="text-gradient">crafted.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                            className="mt-6 max-w-md text-base text-muted-foreground md:text-lg"
                        >
                            A TypeScript rate limiting suite that&apos;s precise,
                            flexible, and a pleasure to use.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 1 }}
                            className="mt-8 flex flex-wrap items-center gap-4"
                        >
                            <Link
                                href="/docs"
                                className="group relative inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-transparent px-6 text-sm font-medium text-foreground transition-all duration-150 active:scale-[0.97] hover:bg-muted"
                            >
                                <span className="pointer-events-none absolute inset-0 rounded-xl border border-primary" />
                                <span className="pointer-events-none absolute inset-[3px] rounded-[9px] border border-primary/50" />
                                <span className="relative">Get Started</span>
                                <ArrowRightBold className="relative ml-1 size-4 text-primary transition-transform group-hover:translate-x-0.5" />
                            </Link>

                            <a
                                href="https://github.com/saoudi-h/ratelock"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-background px-6 text-sm font-medium text-foreground transition-all duration-150 active:scale-[0.97] hover:bg-muted"
                            >
                                <span className="pointer-events-none absolute inset-0 rounded-xl border border-border" />
                                <span className="pointer-events-none absolute inset-[2px] rounded-[10px] border border-border/50" />
                                <span className="relative">
                                    <Icon icon="mdi:github" className="mr-1.5 size-4" />
                                </span>
                                <span className="relative">GitHub</span>
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 1.2 }}
                            className="mt-12 grid grid-cols-3 gap-6 border-t border-border/40 pt-8"
                        >
                            {[
                                { value: '4', label: 'Strategies' },
                                { value: '3', label: 'Adapters' },
                                { value: '0', label: 'Deps (local)' },
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <div className="font-heading text-4xl leading-none font-black tracking-tight md:text-5xl">
                                        <span
                                            className="bg-linear-to-t from-neutral-800 via-neutral-500 to-neutral-800 bg-clip-text text-transparent dark:from-neutral-100 dark:via-neutral-300 dark:to-neutral-100 text-shadow-2xs"
                                        >
                                            {stat.value}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="hidden lg:block"
                    >
                        <AnimatedCodePanel />
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
