'use client'

import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { AdapterBentoCard } from '../components/adapter-bento-card'
import { MotionCardBentoBase } from './CardBentoBase'

export function AdaptersSection() {
    const adapters = [
        {
            name: 'Local',
            tagline: 'In-memory Maps, zero dependencies',
            bestFor: 'Edge functions & single-process nodes',
            metrics: [
                { name: 'Avg latency', val: '< 0.02ms' },
                { name: 'External Deps', val: '0' },
                { name: 'Memory model', val: 'JS Map' }
            ],
            icon: 'solar:ssd-round-bold-duotone',
            brandIcon: 'logos:javascript',
            color: 'text-blue-500'
        },
        {
            name: 'Redis',
            tagline: 'Atomic Lua script pipeline execution',
            bestFor: 'High-traffic distributed clusters',
            metrics: [
                { name: 'Concurrency', val: 'Lua atomic' },
                { name: 'Thread-safety', val: 'Single-thread' },
                { name: 'Data structure', val: 'Sorted Sets' }
            ],
            icon: 'solar:database-bold-duotone',
            brandIcon: 'logos:redis',
            color: 'text-red-500'
        },
        {
            name: 'PostgreSQL',
            tagline: 'Isolated transactional UPSERT queries',
            bestFor: 'Enterprise databases already in your stack',
            metrics: [
                { name: 'Concurrency', val: 'SQL UPSERT' },
                { name: 'Atomicity', val: 'ACID safe' },
                { name: 'Table schema', val: 'Key-value index' }
            ],
            icon: 'solar:server-bold-duotone',
            brandIcon: 'logos:postgresql',
            color: 'text-sky-600'
        },
    ]

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
        <section className="relative border-y border-border/40 bg-muted/30">
            <div className="
              mx-auto max-w-7xl px-6 py-20
              md:py-28
            ">
                {/* Header */}
                <div className="mb-16 max-w-2xl">
                    <span className="
                      inline-flex items-center gap-1.5 rounded-full border
                      border-primary/20 bg-primary/5 px-3 py-1 text-xs
                      font-semibold text-primary select-none
                    ">
                        <Icon icon="solar:database-bold-duotone" className="
                          size-3.5 animate-pulse
                        " />
                        Infrastructure
                    </span>
                    <h2 className="
                      mt-4 font-heading text-4xl/tight font-semibold
                      tracking-tight
                      md:text-5xl
                    ">
                        One API,
                        <br />
                        any backend.
                    </h2>
                    <p className="
                      mt-4 max-w-lg leading-relaxed text-muted-foreground
                    ">
                        Scale from rapid local edge nodes up to massive Postgres or Redis clusters. Swap storage backends instantly by changing a single package import.
                    </p>
                </div>

                {/* Bento Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="
                      grid grid-cols-1 gap-6
                      md:grid-cols-3
                    "
                >
                    {/* Adapters Cards */}
                    {adapters.map((adapter) => (
                        <AdapterBentoCard key={adapter.name} {...adapter} />
                    ))}

                    {/* Bento Box 4: Large Unified Code Swap Tile (Full width on md/lg) */}
                    <MotionCardBentoBase
                        variants={itemVariants}
                        wrapperClassName="
                          md:col-span-3 flex-1
                        "
                        className="grid md:grid-cols-2 items-center gap-10"
                    >
                            <div>
                            <span className="
                              inline-flex items-center gap-1.5 rounded-xl border
                              border-border/40 bg-background px-3 py-1 font-mono
                              text-[10px] font-bold tracking-wider
                              text-muted-foreground uppercase shadow-xs
                              select-none
                            ">
                                <span className="
                                  size-1.5 animate-pulse rounded-full
                                  bg-emerald-500
                                " />
                                Unified Interface
                            </span>
                            <h3 className="
                              mt-6 font-heading text-2xl/tight font-bold
                              tracking-tight text-foreground
                              sm:text-3xl
                            ">
                                Swap backends seamlessly,
                                <br />
                                keeping code intact.
                            </h3>
                            <p className="
                              mt-4 max-w-md text-sm/relaxed
                              text-muted-foreground
                            ">
                                RateLock encapsulates the host-specific database driver logic inside the adapter packages. Your core limiters, validation hooks, API configurations, and custom retry decorators remain **100% unchanged**.
                            </p>
                            <div className="
                              mt-8 flex flex-wrap gap-5 text-xs font-semibold
                              text-muted-foreground
                            ">
                                <div className="
                                  flex items-center gap-1.5 select-none
                                ">
                                    <Icon icon="lucide:check-circle-2" className="
                                      size-4 text-emerald-500
                                    " />
                                    <span>Type-safe imports</span>
                                </div>
                                <div className="
                                  flex items-center gap-1.5 select-none
                                ">
                                    <Icon icon="lucide:check-circle-2" className="
                                      size-4 text-emerald-500
                                    " />
                                    <span>Zero logic edits</span>
                                </div>
                                <div className="
                                  flex items-center gap-1.5 select-none
                                ">
                                    <Icon icon="lucide:check-circle-2" className="
                                      size-4 text-emerald-500
                                    " />
                                    <span>100% testable core</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Dual-Panel visual showing code comparison */}
                        <div className="
                          relative flex w-full flex-col gap-5 overflow-hidden
                          rounded-[1.5rem] border border-border/40 bg-background
                          p-6 font-mono text-[11px] leading-relaxed shadow-sm
                          select-none
                        ">
                            <div className="
                              flex items-center justify-between border-b
                              border-border/20 pb-2 text-[10px] font-bold
                              tracking-wider text-muted-foreground/80 uppercase
                              select-none
                            ">
                                <span>Zero-config Migration</span>
                                <span className="
                                  rounded-lg border border-emerald-500/30
                                  bg-emerald-500/10 px-2 py-0.5 font-mono
                                  text-[8px] font-bold text-emerald-500
                                  shadow-xs select-none
                                ">No Code Changes</span>
                            </div>
                            
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <div className="
                                      text-[10px] font-bold
                                      text-muted-foreground
                                    ">1. Development (Local Memory)</div>
                                    <div className="
                                      overflow-auto rounded-2xl border
                                      border-border/40 bg-muted/40 p-3.5
                                      text-left shadow-xs
                                    ">
                                        <span className="text-red-400">import</span> &#123; createFixedWindowLimiter &#125; <span className="
                                          text-red-400
                                        ">from</span> <span className="
                                          text-emerald-400
                                        ">&apos;@ratelock/local&apos;</span><br />
                                        <span className="text-muted-foreground">// Works instantly in serverless edge/lambda functions</span>
                                    </div>
                                </div>

                                <div className="flex justify-center select-none">
                                    <div className="
                                      rounded-full border border-border/40
                                      bg-muted/40 p-2
                                    ">
                                        <Icon icon="solar:alt-arrow-down-bold-duotone" className="
                                          size-5 animate-bounce text-primary
                                        " />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="
                                      text-[10px] font-bold
                                      text-muted-foreground
                                    ">2. Production (Distributed Redis)</div>
                                    <div className="
                                      overflow-auto rounded-2xl border
                                      border-border/40 bg-muted/40 p-3.5
                                      text-left shadow-xs
                                    ">
                                        <span className="text-red-400">import</span> &#123; createFixedWindowLimiter &#125; <span className="
                                          text-red-400
                                        ">from</span> <span className="
                                          text-emerald-400
                                        ">&apos;@ratelock/redis&apos;</span><br />
                                        <span className="text-muted-foreground">// Swaps engine underneath. Decorator APIs remain identical!</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </MotionCardBentoBase>
                </motion.div>
            </div>
        </section>
    )
}
