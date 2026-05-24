'use client'

import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { FeatureBentoCard } from '../components/feature-bento-card'

export function FeaturesSection() {
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

    return (
        <section className="relative bg-muted/30 border-y border-border/40">
            <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
                {/* Section Header */}
                <div className="mb-16 max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary select-none">
                        <Icon icon="solar:shield-up-bold-duotone" className="size-3.5 animate-pulse" />
                        Security & Resilience
                    </span>
                    <h2 className="mt-4 font-heading text-4xl font-semibold tracking-tight md:text-5xl leading-tight">
                        Hardened for
                        <br />
                        unreliable networks.
                    </h2>
                    <p className="mt-4 max-w-lg text-muted-foreground leading-relaxed">
                        Rate limiting is only as good as its stability during database outages or spam attacks. RateLock provides built-in enterprise resilience layers to protect your stack.
                    </p>
                </div>

                {/* Bento Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="grid gap-6 grid-cols-1 md:grid-cols-3"
                >
                    {/* Bento Card 1: Deny Cache Shield (2/3 width) */}
                    <FeatureBentoCard
                        title="Deny-Only Cache Shield"
                        description="Why saturate your databases checking blacklisted IPs? RateLock caches repeatedly blocked requests in local memory, instantly rejecting malicious spikes in `0.02ms` without making a single network call."
                        icon="solar:shield-bolt-bold-duotone"
                        iconColor="text-emerald-500"
                        iconBgColor="bg-emerald-500/10"
                        colSpan="2"
                        footerTags={["Bypasses database queries", "Configurable TTL limits"]}
                    >
                        {/* Telemetry graphic */}
                        <div className="w-full rounded-2xl border border-border/40 bg-background/50 p-4 font-mono text-[10px] space-y-3 shadow-sm select-none mt-2">
                            <div className="flex items-center justify-between border-b border-border/20 pb-2">
                                <span className="font-bold text-muted-foreground/60 uppercase tracking-wider text-[8px]">DoS mitigation active</span>
                                <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                                    <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                                    Protected
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Blocked Request IP:</span>
                                    <span className="font-bold text-red-500 font-mono">192.168.1.92</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Local Cache State:</span>
                                    <span className="font-bold text-emerald-500 font-mono">Cached (Deny)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Database Query:</span>
                                    <span className="font-bold text-muted-foreground font-mono">Bypassed (0 queries)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Response Latency:</span>
                                    <span className="font-bold text-emerald-500 font-mono">0.02ms (Local)</span>
                                </div>
                            </div>
                        </div>
                    </FeatureBentoCard>

                    {/* Bento Card 2: Circuit Breaker Dashboard (1/3 width) */}
                    <FeatureBentoCard
                        title="Resilient Circuit Breaker"
                        description="Avoid thread pool saturation when your databases fail. RateLock automatically halts queries, redirects calls to fail-safes, and probes recovery periodically."
                        icon="solar:electricity-bold-duotone"
                        iconColor="text-amber-500"
                        iconBgColor="bg-amber-500/10"
                    >
                        {/* Visual representation of Circuit Breaker Cockpit */}
                        <div className="mt-6 rounded-2xl border border-border/40 bg-background/50 p-4 font-mono text-[10px] space-y-2.5 select-none shadow-sm">
                            <div className="text-[8px] uppercase font-bold text-muted-foreground/60 tracking-wider border-b border-border/20 pb-1.5">
                                Circuit telemetry
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground/80">State:</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="font-bold text-amber-500 uppercase tracking-wide">Half-Open</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground/80">Failure threshold:</span>
                                <span className="font-bold text-foreground">5 failed attempts</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground/80">Probing rate:</span>
                                <span className="font-bold text-foreground">1 request / 5s</span>
                            </div>
                        </div>
                    </FeatureBentoCard>

                    {/* Bento Card 3: Code Panel / Fallbacks (1/3 width) */}
                    <FeatureBentoCard
                        title="Fallback Policies"
                        description="Configure your limiters with custom fallback policies to guarantee that rate limit operations never throw runtime exceptions to clients during database hiccups."
                        icon="solar:programming-bold-duotone"
                        iconColor="text-purple-500"
                        iconBgColor="bg-purple-500/10"
                    >
                        {/* Mini Monospaced Code panel */}
                        <div className="mt-6 rounded-2xl border border-border/40 bg-background/50 p-5 font-mono text-[10px] space-y-1.5 overflow-x-auto text-left select-none shadow-sm leading-relaxed">
                            <div><span className="text-purple-400">const</span> limiter = <span className="text-blue-400">await</span> <span className="text-emerald-400">fixedWindow</span>(&#123;</div>
                            <div className="pl-3">limit: <span className="text-yellow-400">100</span>,</div>
                            <div className="pl-3">windowMs: <span className="text-yellow-400">60_000</span>,</div>
                            <div className="pl-3"><span className="text-purple-400">fallback</span>: <span className="text-emerald-300">&apos;allow&apos;</span>, <span className="text-muted-foreground">// Fail-open</span></div>
                            <div>&#125;)</div>
                        </div>
                    </FeatureBentoCard>

                    {/* Bento Card 4: Error Policies (2/3 width) */}
                    <FeatureBentoCard
                        title="Adaptive Error Policies"
                        description="Choose how to handle rate limiting exceptions during extreme database congestion or downtime. Swap behaviors dynamically without rewriting controller logics."
                        icon="solar:tuning-square-bold-duotone"
                        iconColor="text-sky-500"
                        iconBgColor="bg-sky-500/10"
                        colSpan="2"
                        footerTags={["Granular retry policies", "Fully custom error callbacks"]}
                    >
                        {/* Policies description cards grid */}
                        <div className="grid gap-3 w-full mt-2">
                            <div className="rounded-2xl border border-border/40 bg-background/40 p-3 flex items-start gap-3 select-none hover:border-primary/20 transition-colors duration-300 shadow-xs">
                                <div className="flex size-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 font-bold text-xs font-mono select-none">
                                    O
                                </div>
                                <div>
                                    <div className="font-heading text-xs font-bold text-foreground">Fail-Open (Recommended)</div>
                                    <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">Bypasses database failures. Ensures legitimate customers are never locked out of your application during downtime.</div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border/40 bg-background/40 p-3 flex items-start gap-3 select-none hover:border-primary/20 transition-colors duration-300 shadow-xs">
                                <div className="flex size-7 items-center justify-center rounded-xl bg-red-500/10 text-red-500 font-bold text-xs font-mono select-none">
                                    C
                                </div>
                                <div>
                                    <div className="font-heading text-xs font-bold text-foreground">Fail-Closed</div>
                                    <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">Blocks all requests if rate limiting state is offline. Prevents catastrophic security leakages during infrastructure congestion.</div>
                                </div>
                            </div>
                        </div>
                    </FeatureBentoCard>
                </motion.div>
            </div>
        </section>
    )
}
