'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { ArrowRightBold } from '@solar-icons/react-perf'
import { AnimatedCodePanel } from '../components/animated-code-panel'
import { CardBentoBase } from './CardBentoBase'

export function HeroSection() {
    const [copied, setCopied] = useState(false)

    const handleCopyCmd = async () => {
        await navigator.clipboard.writeText('npm install @ratelock/local @ratelock/redis')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.05
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring' as const,
                stiffness: 110,
                damping: 14
            }
        }
    }

    return (
        <section className="relative overflow-hidden bg-background">
            <div className="
              relative mx-auto max-w-7xl px-6 py-12
              md:py-20
              lg:py-24
            ">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="
                      grid grid-cols-1 gap-6
                      lg:grid-cols-12
                    "
                >
                    {/* Hero Text Content (Left side, takes 7 columns on desktop to leave 5 for code) */}
                    <motion.div
                        variants={itemVariants}
                        className="
                          relative flex flex-col justify-center py-6
                          lg:col-span-7 lg:pr-8
                        "
                    >
                        <div>
                            {/* Version Tag */}
                            <div className="mb-8">
                                <span className="
                                  inline-flex items-center gap-2 rounded-xl
                                  border border-border/40 bg-card/50 px-3 py-1.5
                                  font-mono text-xs font-semibold
                                  text-muted-foreground shadow-xs select-none
                                ">
                                    <span className="
                                      size-1.5 animate-pulse rounded-full
                                      bg-primary
                                    " />
                                    v0.2 • Open Source
                                </span>
                            </div>

                            {/* Crisp Value Prop Title */}
                            <h1 className="
                              font-heading text-5xl leading-[0.95] font-black
                              tracking-tight
                              sm:text-6xl
                              lg:text-7xl
                            ">
                                <span className="text-foreground">Rate limiting,</span>
                                <br />
                                <span className="text-muted-foreground">crafted for scale.</span>
                            </h1>

                            {/* Bullet-proof Subtitle */}
                            <p className="
                              mt-6 max-w-xl text-base/relaxed
                              text-muted-foreground
                              md:text-lg
                            ">
                                An exceptionally precise TypeScript rate limiting suite. Unified decorators, atomic storage backends, and modular resilience built for high-performance networks.
                            </p>
                        </div>

                        {/* Interactive Installation Command & Action CTAs */}
                        <div className="
                          mt-10 space-y-4
                          sm:flex sm:flex-wrap sm:items-center sm:gap-4
                          sm:space-y-0
                        ">
                            {/* Get Started primary CTA */}
                            <Link
                                href="/docs"
                                className="
                                  group relative inline-flex h-12 items-center
                                  justify-center gap-2 rounded-2xl bg-foreground
                                  px-6 text-sm font-semibold text-background
                                  shadow-sm transition-all duration-200
                                  select-none
                                  hover:bg-foreground/90
                                  active:scale-95
                                "
                            >
                                <span>Get Started</span>
                                <ArrowRightBold className="
                                  size-4 transition-transform
                                  group-hover:translate-x-0.5
                                " />
                            </Link>

                            {/* GitHub secondary CTA */}
                            <a
                                href="https://github.com/saoudi-h/ratelock"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                  group relative inline-flex h-12 items-center
                                  justify-center gap-2 rounded-2xl border
                                  border-border bg-background px-6 text-sm
                                  font-semibold text-foreground shadow-sm
                                  transition-all duration-200 select-none
                                  hover:bg-muted
                                  active:scale-95
                                "
                            >
                                <Icon icon="mdi:github" className="size-4" />
                                <span>GitHub</span>
                            </a>

                            {/* Technical Copy command tile */}
                            <button
                                onClick={handleCopyCmd}
                                className="
                                  group flex h-12 w-full items-center
                                  justify-between gap-3 rounded-2xl border
                                  border-border/40 bg-muted/40 px-5 font-mono
                                  text-xs font-semibold text-muted-foreground
                                  shadow-xs transition-all duration-200
                                  select-none
                                  hover:bg-muted/80 hover:text-foreground
                                  active:scale-95
                                  sm:w-auto
                                "
                                title="Copy install command"
                            >
                                <span className="
                                  mr-1 text-primary opacity-70
                                  transition-opacity
                                  group-hover:opacity-100
                                ">$</span>
                                <span>npm i @ratelock/local</span>
                                <div className="mx-1 h-4 w-px bg-border/40" />
                                {copied ? (
                                    <Icon icon="lucide:check" className="
                                      size-4 text-emerald-500
                                    " />
                                ) : (
                                    <Icon icon="lucide:copy" className="
                                      size-3.5 text-muted-foreground
                                      transition-colors
                                      group-hover:text-foreground
                                    " />
                                )}
                            </button>
                        </div>
                    </motion.div>

                    {/* Right side: Code Panel Tile (takes 5 columns on desktop) */}
                    <motion.div
                        variants={itemVariants}
                        className="
                          relative flex w-full flex-col items-center
                          justify-center
                          lg:col-span-5 lg:items-end
                        "
                    >
                        <div className="
                          w-full max-w-125 transform transition-transform
                          duration-500
                          hover:scale-[1.02]
                          lg:max-w-none
                        ">
                            {/* We wrap AnimatedCodePanel in a larger container to remove the cramped look */}
                            <div className="
                              rounded-2xl border border-border/40 bg-card/40 p-2
                              shadow-xs backdrop-blur-md
                            ">
                                <div className="w-full">
                                    <AnimatedCodePanel />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Dense Telemetry Stats (Full width row) */}
                    <motion.div
                        variants={itemVariants}
                        className="
                          mt-6 grid grid-cols-2 gap-6
                          lg:col-span-12 lg:grid-cols-4
                        "
                    >
                        {[
                            { value: '4', label: 'Limiting Strategies', desc: 'Fixed, Sliding, Token Bucket' },
                            { value: '3', label: 'Storage Adapters', desc: 'Memory, Redis, PostgreSQL' },
                            { value: '0', label: 'Local Dependencies', desc: 'Zero runtime bundle bloat' },
                            { value: '100%', label: 'Type-Safe Core', desc: 'Engineered with zero leaks' },
                        ].map((stat, i) => (
                            // <div
                            //     key={i}
                            //     className="
                            //       group relative flex flex-col justify-between
                            //       overflow-hidden rounded-4xl bg-card/60 p-1
                            //       shadow-xs transition-colors duration-200
                            //       select-none
                            //       hover:bg-card/60
                            //     "
                            // >
                            <CardBentoBase key={i}>
                                <div className="
                                  font-heading text-5xl leading-none font-black
                                  tracking-tighter text-foreground/50
                                  transition-colors duration-200 text-shadow-xs
                                  group-hover:text-primary/80
                                  md:text-6xl
                                ">
                                    {stat.value}
                                </div>
                                <div className="mt-6 pt-4">
                                    <div className="
                                      text-xs font-bold tracking-wider
                                      text-muted-foreground uppercase
                                    ">
                                        {stat.label}
                                    </div>
                                    <div className="
                                      mt-1.5 text-[11px] leading-normal
                                      font-medium text-muted-foreground/70
                                    ">
                                        {stat.desc}
                                    </div>
                                </div>
                            </CardBentoBase>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}

