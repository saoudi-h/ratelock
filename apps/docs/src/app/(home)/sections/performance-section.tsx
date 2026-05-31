'use client'

import { Icon } from '@iconify/react'
import { ArrowRightBold } from '@solar-icons/react-perf'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { MotionCardBentoBase } from './CardBentoBase'

type BackendType = 'memory' | 'redis' | 'postgres'

interface PerformanceMetric {
    name: string
    throughput: number
    latency: string
    isRateLock: boolean
    color: string
}

export function PerformanceSection() {
    const [activeBackend, setActiveBackend] = useState<BackendType>('memory')
    const [denyCacheFlooded, setDenyCacheFlooded] = useState(false)

    // Interval to toggle Deny Cache animation state for the micro-animation
    useEffect(() => {
        const interval = setInterval(() => {
            setDenyCacheFlooded(prev => !prev)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    const backendData: Record<
        BackendType,
        {
            title: string
            description: string
            multiplier: string
            metrics: PerformanceMetric[]
        }
    > = {
        memory: {
            title: 'In-Memory Counter Throughput',
            description: 'In-memory JS Maps with zero network round-trips.',
            multiplier: '3.6x higher',
            metrics: [
                {
                    name: 'RateLock Local Fixed Window',
                    throughput: 2166631,
                    latency: '0.04ms',
                    isRateLock: true,
                    color: 'from-emerald-500 to-teal-500',
                },
                {
                    name: 'rate-limiter-flexible Memory',
                    throughput: 594228,
                    latency: '0.13ms',
                    isRateLock: false,
                    color: 'from-muted-foreground/30 to-muted-foreground/40',
                },
            ],
        },
        redis: {
            title: 'Distributed Redis Throughput',
            description: 'Atomic Lua scripts executed directly on the Redis thread.',
            multiplier: '5.6x higher',
            metrics: [
                {
                    name: 'RateLock Redis Fixed Window',
                    throughput: 131650,
                    latency: '0.61ms',
                    isRateLock: true,
                    color: 'from-red-500 to-orange-500',
                },
                {
                    name: 'rate-limiter-flexible Redis',
                    throughput: 23221,
                    latency: '3.35ms',
                    isRateLock: false,
                    color: 'from-muted-foreground/30 to-muted-foreground/40',
                },
            ],
        },
        postgres: {
            title: 'PostgreSQL Driver Comparison',
            description: 'Comparing write-ahead logging against unlogged tables in node-postgres.',
            multiplier: '18% higher',
            metrics: [
                {
                    name: 'RateLock Fixed Window (Unlogged)',
                    throughput: 7723,
                    latency: '10.3ms',
                    isRateLock: true,
                    color: 'from-sky-500 to-indigo-500',
                },
                {
                    name: 'RateLock Fixed Window (Logged)',
                    throughput: 6539,
                    latency: '12.1ms',
                    isRateLock: false,
                    color: 'from-muted-foreground/30 to-muted-foreground/40',
                },
            ],
        },
    }

    const currentBackend = backendData[activeBackend]
    const maxThroughput = Math.max(...currentBackend.metrics.map(m => m.throughput))

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.05,
            },
        },
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring' as const,
                stiffness: 110,
                damping: 14,
            },
        },
    }

    return (
        <section className="relative overflow-hidden border-b border-border/40 bg-background/50">
            {/* Background Lights */}
            <div className="absolute -top-40 right-0 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 -z-10 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />

            <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
                {/* Section Header */}
                <div className="mb-16 max-w-3xl">
                    <span
                        className="
                      inline-flex items-center gap-1.5 rounded-full border
                      border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs
                      font-semibold text-emerald-500 select-none
                    ">
                        <Icon icon="solar:bolt-bold-duotone" className="size-3.5 animate-pulse" />
                        Performance
                    </span>
                    <h2 className="mt-4 font-heading text-4xl/tight font-semibold tracking-tight md:text-5xl">
                        Throughput and latency metrics.
                    </h2>
                    <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
                        Performance data from our standard benchmark suite comparing RateLock to
                        industry solutions under concurrent workloads.
                    </p>
                </div>

                {/* Bento Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Bento Box 1: Interactive Comparison Charts */}
                    <MotionCardBentoBase
                        variants={itemVariants}
                        wrapperClassName="lg:col-span-7 flex flex-col justify-between"
                        className="gap-8">
                        {/* Selector Header */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <span
                                    className="
                                  inline-flex items-center gap-1.5 rounded-xl border
                                  border-border/40 bg-background px-3 py-1 font-mono
                                  text-[10px] font-bold tracking-wider
                                  text-muted-foreground uppercase shadow-xs
                                  select-none
                                ">
                                    Compare Backends
                                </span>
                                <h3 className="mt-3 font-heading text-xl font-bold text-foreground">
                                    Throughput Comparison
                                </h3>
                            </div>

                            {/* Backend Selection Tabs */}
                            <div className="flex rounded-xl border border-border/40 bg-muted/40 p-1 shadow-xs">
                                {(['memory', 'redis', 'postgres'] as BackendType[]).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setActiveBackend(type)}
                                        className={`
                                          relative rounded-lg px-3.5 py-1.5 text-xs font-semibold
                                          transition-all duration-200 uppercase tracking-wider
                                          select-none active:scale-95
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

                        {/* Chart Area */}
                        <div className="flex flex-1 flex-col justify-center space-y-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeBackend}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6">
                                    {currentBackend.metrics.map((metric, idx) => {
                                        const pct = (metric.throughput / maxThroughput) * 100
                                        return (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex items-center justify-between text-xs font-semibold">
                                                    <span
                                                        className={`
                                                      flex items-center gap-1.5
                                                      ${metric.isRateLock ? 'text-foreground font-bold' : 'text-muted-foreground'}
                                                    `}>
                                                        {metric.isRateLock && (
                                                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        )}
                                                        {metric.name}
                                                    </span>
                                                    <span className="font-mono text-muted-foreground">
                                                        {metric.throughput.toLocaleString()} ops/s •{' '}
                                                        {metric.latency}
                                                    </span>
                                                </div>

                                                {/* Visual Bar */}
                                                <div
                                                    className="
                                                  relative h-8 w-full overflow-hidden rounded-2xl
                                                  border border-border/20 bg-muted/20 p-1
                                                ">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{
                                                            type: 'spring',
                                                            stiffness: 70,
                                                            damping: 15,
                                                        }}
                                                        className={`
                                                          h-full rounded-xl bg-gradient-to-r shadow-sm
                                                          ${metric.color}
                                                        `}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Chart Footer Commentary */}
                        <div
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
                                    <strong className="text-foreground">
                                        {currentBackend.multiplier}
                                    </strong>{' '}
                                    higher under this workload.
                                </span>
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground/60 select-none">
                                Matrix 4 Baseline • 80 Concurrency • Reference Hardware (AMD Ryzen 7 5800X, 32GB RAM)
                            </span>
                        </div>
                    </MotionCardBentoBase>

                    {/* Bento Box 2: Deny Cache Visual Demonstration */}
                    <MotionCardBentoBase
                        variants={itemVariants}
                        wrapperClassName="lg:col-span-5 flex flex-col justify-between"
                        className="gap-8">
                        <div>
                            <span
                                className="
                              inline-flex items-center gap-1.5 rounded-xl border
                              border-border/40 bg-background px-3 py-1 font-mono
                              text-[10px] font-bold tracking-wider
                              text-muted-foreground uppercase shadow-xs
                              select-none
                            ">
                                <span
                                    className={`
                                  size-1.5 rounded-full animate-pulse
                                  ${denyCacheFlooded ? 'bg-emerald-500' : 'bg-red-500'}
                                `}
                                />
                                {denyCacheFlooded ? 'Shield Active (Spam Blocked)' : 'Shield Inactive (DB Hit)'}
                            </span>
                            <h3 className="mt-3 font-heading text-xl font-bold text-foreground">
                                Spam Protection with Deny Cache
                            </h3>
                            <p className="mt-2 text-xs/relaxed text-muted-foreground">
                                The `withCache` decorator stores blocked keys in a local,
                                short-lived cache. Subsequent requests fail immediately in memory,
                                preventing network round-trips to your database.
                            </p>
                        </div>

                        {/* Interactive Animation Diagram panel */}
                        <div
                            className="
                          relative flex h-48 w-full flex-col items-center justify-center
                          overflow-hidden rounded-3xl border border-border/40
                          bg-muted/40 p-4 font-mono text-[10px] shadow-inner
                          select-none
                        ">
                            {/* Client Block */}
                            <div className="absolute top-6 flex flex-col items-center gap-1">
                                <Icon
                                    icon="solar:user-bold-duotone"
                                    className="size-6 text-zinc-500"
                                />
                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                                    Spam Client
                                </span>
                            </div>

                            {/* Database Server Block */}
                            <div className="absolute bottom-6 flex flex-col items-center gap-1 z-10">
                                <Icon
                                    icon="solar:database-bold-duotone"
                                    className={`size-6 transition-colors duration-300 ${
                                        denyCacheFlooded
                                            ? 'text-emerald-500 filter drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]'
                                            : 'text-red-500 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                                    }`}
                                />
                                <span className={`text-[8px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                                    denyCacheFlooded ? 'text-emerald-500' : 'text-red-500 font-extrabold'
                                }`}>
                                    Database Server
                                </span>
                            </div>

                            {/* Request Flow Dot Line */}
                            <div className="absolute inset-y-0 w-0.5 bg-border/20" />

                            {/* Local Cache Shield Panel */}
                            <div
                                className={`
                                  absolute top-1/2 -translate-y-1/2 z-10 flex items-center gap-2
                                  rounded-2xl border px-4 py-2 transition-all duration-300 bg-background/90 shadow-sm
                                  ${
                                      denyCacheFlooded
                                          ? 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400'
                                          : 'border-zinc-800 bg-zinc-900/20 text-zinc-500'
                                  }
                                `}>
                                <Icon
                                    icon="solar:shield-bold-duotone"
                                    className={`size-4 transition-colors duration-300 ${
                                        denyCacheFlooded
                                            ? 'text-emerald-500'
                                            : 'text-zinc-600'
                                    }`}
                                />
                                <span className="text-[9px] font-bold uppercase tracking-wider">
                                    Deny Cache
                                </span>
                            </div>

                            {/* Moving Particles representing spammed (denied) requests in red, accepted in green */}
                            <div className="absolute top-[36px] bottom-[36px] left-1/2 -translate-x-1/2 w-1 pointer-events-none">
                                {denyCacheFlooded ? (
                                    // Shield Active: Green (allowed) then Red (blocked at shield)
                                    <div className="absolute inset-0">
                                        {/* Particle 1 (Allowed): Green, reaches Database */}
                                        <motion.div
                                            initial={{ y: 0, opacity: 0 }}
                                            animate={{ y: 120, opacity: [0, 1, 1, 0] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1.0,
                                                repeatDelay: 1.2,
                                                ease: 'linear',
                                            }}
                                            className="absolute top-0 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"
                                        />
                                        {/* Particle 2 (Blocked): Red, stopped at Deny Cache */}
                                        <motion.div
                                            initial={{ y: 0, opacity: 0 }}
                                            animate={{ y: 60, opacity: [0, 1, 1, 0] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 0.5,
                                                repeatDelay: 1.7,
                                                ease: 'linear',
                                                delay: 0.6,
                                            }}
                                            className="absolute top-0 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"
                                        />
                                        {/* Particle 3 (Blocked): Red, stopped at Deny Cache */}
                                        <motion.div
                                            initial={{ y: 0, opacity: 0 }}
                                            animate={{ y: 60, opacity: [0, 1, 1, 0] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 0.5,
                                                repeatDelay: 1.7,
                                                ease: 'linear',
                                                delay: 1.1,
                                            }}
                                            className="absolute top-0 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"
                                        />
                                        {/* Particle 4 (Blocked): Red, stopped at Deny Cache */}
                                        <motion.div
                                            initial={{ y: 0, opacity: 0 }}
                                            animate={{ y: 60, opacity: [0, 1, 1, 0] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 0.5,
                                                repeatDelay: 1.7,
                                                ease: 'linear',
                                                delay: 1.6,
                                            }}
                                            className="absolute top-0 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"
                                        />
                                    </div>
                                ) : (
                                    // Shield Inactive: Green (allowed) then Red (hammers Database directly)
                                    <div className="absolute inset-0">
                                        {/* Particle 1 (Allowed): Green, reaches Database */}
                                        <motion.div
                                            initial={{ y: 0, opacity: 0 }}
                                            animate={{ y: 120, opacity: [0, 1, 1, 0] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1.0,
                                                repeatDelay: 1.6,
                                                ease: 'linear',
                                            }}
                                            className="absolute top-0 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"
                                        />
                                        {/* Particle 2 (Blocked): Red, reaches Database */}
                                        <motion.div
                                            initial={{ y: 0, opacity: 0 }}
                                            animate={{ y: 120, opacity: [0, 1, 1, 0] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1.0,
                                                repeatDelay: 1.6,
                                                ease: 'linear',
                                                delay: 0.6,
                                            }}
                                            className="absolute top-0 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"
                                        />
                                        {/* Particle 3 (Blocked): Red, reaches Database */}
                                        <motion.div
                                            initial={{ y: 0, opacity: 0 }}
                                            animate={{ y: 120, opacity: [0, 1, 1, 0] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1.0,
                                                repeatDelay: 1.6,
                                                ease: 'linear',
                                                delay: 1.2,
                                            }}
                                            className="absolute top-0 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"
                                        />
                                        {/* Particle 4 (Blocked): Red, reaches Database */}
                                        <motion.div
                                            initial={{ y: 0, opacity: 0 }}
                                            animate={{ y: 120, opacity: [0, 1, 1, 0] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1.0,
                                                repeatDelay: 1.6,
                                                ease: 'linear',
                                                delay: 1.8,
                                            }}
                                            className="absolute top-0 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Performance boost callout */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-muted-foreground">
                                    Without Cache (DB Hits):
                                </span>
                                <span className="font-mono text-muted-foreground">
                                    ~1,200 ops/s
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-foreground">
                                <span className="flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                    With Deny Cache (Shielded):
                                </span>
                                <span className="font-mono text-emerald-500">2,418,094 ops/s</span>
                            </div>
                        </div>
                    </MotionCardBentoBase>
                </motion.div>

                {/* Explore docs CTA link block */}
                <div className="mt-16 flex justify-center">
                    <Link
                        href="/docs/benchmarks"
                        className="
                          group relative inline-flex h-12 items-center
                          justify-center gap-2 rounded-2xl bg-foreground
                          px-6 text-sm font-semibold text-background
                          shadow-sm transition-all duration-200
                          select-none hover:bg-foreground/90
                          active:scale-95
                        ">
                        <span>Explore Full Benchmarks & Methodologies</span>
                        <ArrowRightBold className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </div>
        </section>
    )
}
